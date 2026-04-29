import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdminUser } from "@/lib/admin"
import { checkin } from "@/lib/payment/shouqianba"
import { loadPaymentSettings, toShouQianBaConfig } from "@/lib/payment/config"

export const dynamic = "force-dynamic"

/**
 * 终端签到
 * 文档：https://doc.shouqianba.com/zh-cn/api/interface/checkin.html
 *
 * 调用后会用配置中的 device_id 进行签到，并将新的 terminal_key 写回数据库。
 */
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "非管理员用户" }, { status: 403 })
  }

  const settings = await loadPaymentSettings()
  const config = toShouQianBaConfig(settings)
  if (!settings || !config) {
    return NextResponse.json(
      { error: "终端凭证不完整，请先完成激活" },
      { status: 400 },
    )
  }

  const deviceId = settings.device_id?.trim()
  if (!deviceId) {
    return NextResponse.json({ error: "请先配置设备 ID（device_id）" }, { status: 400 })
  }

  try {
    const result = await checkin(config, { device_id: deviceId })
    const ok = result.result_code === "200"
    const newTerminalKey =
      result.biz_response?.terminal_key ??
      result.biz_response?.data?.terminal_key ??
      null

    if (!ok || !newTerminalKey) {
      return NextResponse.json(
        {
          ok: false,
          error:
            result.biz_response?.error_message ??
            result.error_message ??
            "签到失败",
          result,
        },
        { status: 400 },
      )
    }

    const admin = createAdminClient()
    await admin
      .from("admin_payment_settings")
      .update({
        terminal_key: newTerminalKey,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1)

    return NextResponse.json({ ok: true, message: "签到成功，已更新终端密钥" })
  } catch (err) {
    console.error("[v0] Checkin error:", err)
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "签到请求失败" },
      { status: 502 },
    )
  }
}
