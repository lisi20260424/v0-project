import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { loadPaymentSettings, toShouQianBaConfig } from "@/lib/payment/config"
import { mapOrderStatus, query } from "@/lib/payment/shouqianba"
import { handlePaymentSuccess } from "@/lib/payment/success"

export const dynamic = "force-dynamic"

/**
 * 查询订单状态。先返回数据库状态；若仍处于 pending，则调用收钱吧主动查询，
 * 若发现已支付则在此处完成订单后置处理（防止异步通知丢失）。
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: order, error } = await admin
    .from("subscription_orders")
    .select(
      "id, user_id, plan_code, plan_kind, plan_name, amount, status, payment_method, provider_order_sn, qr_code_content, paid_at, expires_at, created_at",
    )
    .eq("id", id)
    .maybeSingle()

  if (error || !order) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 })
  }
  if (order.user_id !== user.id) {
    return NextResponse.json({ error: "无权访问该订单" }, { status: 403 })
  }

  // 终态直接返回
  if (order.status !== "pending") {
    return NextResponse.json({ order: serializeOrder(order) })
  }

  // 检查是否已超时
  if (order.expires_at && new Date(order.expires_at).getTime() < Date.now()) {
    await admin.from("subscription_orders").update({ status: "expired" }).eq("id", order.id)
    return NextResponse.json({ order: serializeOrder({ ...order, status: "expired" }) })
  }

  // 主动查询收钱吧
  if (order.provider_order_sn) {
    const settings = await loadPaymentSettings()
    const sqbConfig = toShouQianBaConfig(settings)
    if (sqbConfig) {
      try {
        const result = await query(sqbConfig, order.provider_order_sn)
        const remoteStatus = result.biz_response?.data?.order_status
        const mapped = mapOrderStatus(remoteStatus)
        if (mapped === "paid") {
          await handlePaymentSuccess(order.id)
          const { data: refreshed } = await admin
            .from("subscription_orders")
            .select(
              "id, user_id, plan_code, plan_kind, plan_name, amount, status, payment_method, provider_order_sn, qr_code_content, paid_at, expires_at, created_at",
            )
            .eq("id", order.id)
            .maybeSingle()
          return NextResponse.json({ order: serializeOrder(refreshed ?? order) })
        }
        if (mapped === "canceled" || mapped === "failed") {
          await admin
            .from("subscription_orders")
            .update({ status: mapped })
            .eq("id", order.id)
          return NextResponse.json({ order: serializeOrder({ ...order, status: mapped }) })
        }
      } catch (err) {
        // 忽略主动查询失败，继续返回 pending
        console.error("[v0] payment query failed:", err)
      }
    }
  }

  return NextResponse.json({ order: serializeOrder(order) })
}

function serializeOrder(order: Record<string, unknown>) {
  return {
    id: order.id,
    planKind: order.plan_kind,
    planCode: order.plan_code,
    planName: order.plan_name,
    amount: order.amount,
    status: order.status,
    paymentMethod: order.payment_method,
    qrCode: order.qr_code_content,
    expiresAt: order.expires_at,
    paidAt: order.paid_at,
    createdAt: order.created_at,
  }
}
