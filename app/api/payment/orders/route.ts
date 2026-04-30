import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { findPlan, type PlanKind } from "@/lib/payment/plans"
import { loadPaymentSettings, toShouQianBaConfig } from "@/lib/payment/config"
import {
  generateClientSn,
  paymentMethodToPayway,
  precreate,
} from "@/lib/payment/shouqianba"

export const dynamic = "force-dynamic"

/**
 * 创建支付订单
 * Body: { planKind: 'membership'|'points', planCode: string, paymentMethod: 'wechat'|'alipay' }
 * 返回：{ orderId, qrCode, expiresAt, paymentMethod, amount, planName }
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: "参数无效" }, { status: 400 })
  }

  const { planKind, planCode, paymentMethod } = body as {
    planKind?: PlanKind
    planCode?: string
    paymentMethod?: "wechat" | "alipay"
  }

  if (!planKind || (planKind !== "membership" && planKind !== "points")) {
    return NextResponse.json({ error: "套餐类型无效" }, { status: 400 })
  }
  if (!planCode || typeof planCode !== "string") {
    return NextResponse.json({ error: "套餐代码无效" }, { status: 400 })
  }
  if (paymentMethod !== "wechat" && paymentMethod !== "alipay") {
    return NextResponse.json({ error: "支付方式无效" }, { status: 400 })
  }

  const plan = findPlan(planKind, planCode)
  if (!plan) {
    return NextResponse.json({ error: "套餐不存在" }, { status: 404 })
  }

  const settings = await loadPaymentSettings()
  if (!settings || !settings.enabled) {
    return NextResponse.json(
      { error: "支付功能尚未开通，请联系管理员" },
      { status: 503 },
    )
  }

  const sqbConfig = toShouQianBaConfig(settings)
  if (!sqbConfig) {
    return NextResponse.json(
      { error: "支付配置不完整，请联系管理员" },
      { status: 503 },
    )
  }

  const admin = createAdminClient()

  // 套餐元数据
  const planName = "name" in plan ? plan.name : `${plan.totalPoints} 点套餐`
  const isMembership = planKind === "membership"
  const bonusPoints = isMembership
    ? (plan as { bonusPoints: number }).bonusPoints
    : (plan as { totalPoints: number }).totalPoints

  let vipStartsAt: string | null = null
  let vipExpiresAt: string | null = null
  let vipTier: string | null = null
  if (isMembership) {
    const m = plan as { vipTier: string; validDays: number | null }
    vipTier = m.vipTier
    const start = new Date()
    vipStartsAt = start.toISOString()
    if (m.validDays) {
      const end = new Date(start)
      end.setDate(end.getDate() + m.validDays)
      vipExpiresAt = end.toISOString()
    }
  }

  // 收钱吧预下单的二维码有效期约 4 分钟，订单 15 分钟内有效
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

  const { data: order, error: insertError } = await admin
    .from("subscription_orders")
    .insert({
      user_id: user.id,
      plan_code: plan.id,
      plan_kind: planKind,
      plan_name: planName,
      amount: plan.price,
      original_amount: plan.originalPrice,
      bonus_points: bonusPoints,
      vip_tier: vipTier,
      vip_starts_at: vipStartsAt,
      vip_expires_at: vipExpiresAt,
      status: "pending",
      payment_method: paymentMethod,
      payment_provider: "shouqianba",
      expires_at: expiresAt,
    })
    .select("id")
    .single()

  if (insertError || !order) {
    return NextResponse.json(
      { error: insertError?.message ?? "订单创建失败" },
      { status: 500 },
    )
  }

  // 调用收钱吧预下单
  const clientSn = generateClientSn()
  const totalAmountFen = Math.round(Number(plan.price) * 100).toString()
  const operator =
    (settings.operator ?? "").trim() ||
    (user.email ?? "").slice(0, 32) ||
    user.id.slice(0, 8)

  let qrCode: string | null = null
  let providerSn: string | null = null
  let providerErrorMessage: string | null = null
  let providerResponse: unknown = null

  try {
    const result = await precreate(sqbConfig, {
      client_sn: clientSn,
      total_amount: totalAmountFen,
      payway: paymentMethodToPayway(paymentMethod),
      subject: planName.slice(0, 64),
      operator,
      notify_url: settings.notify_url || undefined,
      description: `${planName} - ${user.email ?? user.id}`.slice(0, 255),
      reflect: order.id,
    })

    providerResponse = result

    const bizCode = result.biz_response?.result_code
    if (
      result.result_code === "200" &&
      (bizCode === "PRECREATE_SUCCESS" || bizCode === "SUCCESS")
    ) {
      qrCode = result.biz_response?.data?.qr_code ?? null
      providerSn = result.biz_response?.data?.sn ?? null
    } else {
      providerErrorMessage =
        result.biz_response?.error_message ??
        result.error_message ??
        result.biz_response?.error_code ??
        result.error_code ??
        "支付预下单失败"
    }
  } catch (err) {
    providerErrorMessage = err instanceof Error ? err.message : "调用支付网关失败"
  }

  await admin
    .from("subscription_orders")
    .update({
      provider_order_sn: clientSn,
      provider_response: providerResponse as Record<string, unknown>,
      qr_code_content: qrCode,
      status: providerErrorMessage ? "failed" : "pending",
    })
    .eq("id", order.id)

  if (providerErrorMessage || !qrCode) {
    return NextResponse.json(
      {
        orderId: order.id,
        error: providerErrorMessage ?? "未获取到支付二维码",
      },
      { status: 502 },
    )
  }

  return NextResponse.json({
    orderId: order.id,
    qrCode,
    providerSn,
    expiresAt,
    paymentMethod,
    amount: plan.price,
    planName,
  })
}
