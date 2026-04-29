import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdminUser } from "@/lib/admin"
import { activate, SQB_API_DOMAIN_PROD, SQB_API_DOMAIN_TEST } from "@/lib/payment/shouqianba"
import { loadPaymentSettings } from "@/lib/payment/config"

export const dynamic = "force-dynamic"

/**
 * 终端激活
 * 文档：https://doc.shouqianba.com/zh-cn/api/interface/activate.html
 *
 * Body: { code: string, deviceId?: string, name?: string }
 * 使用配置中的 vendor_sn / vendor_key / app_id 完成激活，
 * 激活成功后会把返回的 terminal_sn / terminal_key 写回 admin_payment_settings。
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: "无权限" }, { status: 403 })
  }

  const body = (await request.json().catch(() => null)) as {
    code?: string
    deviceId?: string
    name?: string
  } | null

  const code = body?.code?.trim()
  if (!code) {
    return NextResponse.json({ error: "请填写激活码" }, { status: 400 })
  }

  const settings = await loadPaymentSettings()
  if (!settings) {
    return NextResponse.json({ error: "支付配置未初始化" }, { status: 400 })
  }
  if (!settings.vendor_sn || !settings.vendor_key) {
    return NextResponse.json(
      { error: "缺少服务商凭证（vendor_sn / vendor_key）" },
      { status: 400 },
    )
  }
  if (!settings.app_id) {
    return NextResponse.json({ error: "缺少应用 ID（app_id）" }, { status: 400 })
  }

  const deviceId = (body?.deviceId ?? settings.device_id ?? "").trim()
  if (!deviceId) {
    return NextResponse.json({ error: "请填写设备 ID（device_id）" }, { status: 400 })
  }

  const gatewayUrl =
    settings.gateway_url?.trim() ||
    (settings.test_mode ? SQB_API_DOMAIN_TEST : SQB_API_DOMAIN_PROD)

  try {
    const result = await activate(
      {
        terminal_sn: settings.terminal_sn ?? "",
        terminal_key: settings.terminal_key ?? "",
        vendor_sn: settings.vendor_sn,
        vendor_key: settings.vendor_key,
        app_id: settings.app_id,
        gateway_url: gatewayUrl,
        test_mode: settings.test_mode,
      },
      {
        code,
        device_id: deviceId,
        name: body?.name?.trim() || undefined,
      },
    )

    const ok = result.result_code === "200"
    const newTerminalSn =
      result.biz_response?.terminal_sn ??
      result.biz_response?.data?.terminal_sn ??
      null
    const newTerminalKey =
      result.biz_response?.terminal_key ??
      result.biz_response?.data?.terminal_key ??
      null

    if (!ok || !newTerminalSn || !newTerminalKey) {
      return NextResponse.json(
        {
          error:
            result.biz_response?.error_message ??
            result.error_message ??
            "激活失败，请确认激活码是否正确",
          result,
        },
        { status: 400 },
      )
    }

    const admin = createAdminClient()
    await admin
      .from("admin_payment_settings")
      .update({
        terminal_sn: newTerminalSn,
        terminal_key: newTerminalKey,
        device_id: deviceId,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1)

    return NextResponse.json({
      ok: true,
      terminalSn: newTerminalSn,
      message: "终端激活成功",
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "激活请求失败" },
      { status: 502 },
    )
  }
}
