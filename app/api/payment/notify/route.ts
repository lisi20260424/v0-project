import { type NextRequest, NextResponse } from "next/server"
import { mapOrderStatus, verifyNotifySignature } from "@/lib/payment/shouqianba"
import { loadPaymentSettings } from "@/lib/payment/config"
import { createAdminClient } from "@/lib/supabase/admin"
import { handlePaymentSuccess } from "@/lib/payment/success"

/**
 * 收钱吧异步通知接口
 * 文档：https://doc.shouqianba.com/zh-cn/api/sign.html#异步通知
 * 收钱吧通过 HTTP POST 推送支付结果，请求头携带：
 *   Authorization: <terminal_sn> <md5(body + terminal_key)>
 * 处理结果应当返回 HTTP 200 + 字符串 "SUCCESS"，否则会被多次重推。
 */
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const authorization =
      request.headers.get("Authorization") ?? request.headers.get("authorization") ?? ""
    const rawBody = await request.text()

    const settings = await loadPaymentSettings()
    if (!settings || !settings.terminal_key) {
      console.error("[v0] payment notify: terminal_key not configured")
      return new NextResponse("FAIL", { status: 200 })
    }

    if (!verifyNotifySignature(rawBody, authorization, settings.terminal_key)) {
      console.error("[v0] payment notify: signature invalid")
      return new NextResponse("FAIL", { status: 200 })
    }

    const payload = JSON.parse(rawBody) as {
      client_sn?: string
      sn?: string
      status?: string
      order_status?: string
      reflect?: string
    }

    const clientSn = payload.client_sn
    const reflect = payload.reflect
    if (!clientSn && !reflect) {
      return new NextResponse("FAIL", { status: 200 })
    }

    const admin = createAdminClient()

    let order: { id: string; status: string } | null = null
    if (reflect) {
      const { data } = await admin
        .from("subscription_orders")
        .select("id, status")
        .eq("id", reflect)
        .maybeSingle()
      order = data
    }
    if (!order && clientSn) {
      const { data } = await admin
        .from("subscription_orders")
        .select("id, status")
        .eq("provider_order_sn", clientSn)
        .maybeSingle()
      order = data
    }

    if (!order) {
      // 找不到订单也直接返回 SUCCESS，避免无限重推
      return new NextResponse("SUCCESS", { status: 200 })
    }

    if (order.status === "paid") {
      return new NextResponse("SUCCESS", { status: 200 })
    }

    const mapped = mapOrderStatus(payload.order_status ?? payload.status)
    if (mapped === "paid") {
      await handlePaymentSuccess(order.id)
    } else if (mapped === "canceled" || mapped === "failed") {
      await admin
        .from("subscription_orders")
        .update({ status: mapped, provider_response: payload as Record<string, unknown> })
        .eq("id", order.id)
    }

    return new NextResponse("SUCCESS", { status: 200 })
  } catch (error) {
    console.error("[v0] payment notify error:", error)
    return new NextResponse("FAIL", { status: 200 })
  }
}
