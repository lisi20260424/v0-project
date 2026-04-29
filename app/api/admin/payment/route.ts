import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdminUser } from "@/lib/admin"
import { PAYMENT_SETTINGS_SELECT } from "@/lib/payment/config"

async function ensureAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminUser(user)) {
    return null
  }
  return user
}

export async function GET() {
  const user = await ensureAdmin()
  if (!user) {
    return NextResponse.json({ error: "无权限" }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("admin_payment_settings")
    .select(PAYMENT_SETTINGS_SELECT)
    .eq("id", 1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function PUT(request: Request) {
  const user = await ensureAdmin()
  if (!user) {
    return NextResponse.json({ error: "无权限" }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: "参数无效" }, { status: 400 })
  }

  const {
    enabled,
    vendorSn,
    vendorKey,
    appId,
    terminalSn,
    terminalKey,
    deviceId,
    operator,
    notifyUrl,
    returnUrl,
    gatewayUrl,
    callbackPublicKey,
    testMode,
  } = body as Record<string, unknown>

  // URL 格式校验
  for (const [key, value] of Object.entries({ notifyUrl, returnUrl, gatewayUrl })) {
    if (value && typeof value === "string" && value.trim()) {
      try {
        new URL(value)
      } catch {
        return NextResponse.json({ error: `${key} 地址格式无效` }, { status: 400 })
      }
    }
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("admin_payment_settings")
    .update({
      enabled: !!enabled,
      vendor_sn: typeof vendorSn === "string" ? vendorSn.trim() : "",
      vendor_key: typeof vendorKey === "string" ? vendorKey : "",
      app_id: typeof appId === "string" ? appId.trim() : "",
      terminal_sn: typeof terminalSn === "string" ? terminalSn.trim() : "",
      terminal_key: typeof terminalKey === "string" ? terminalKey : "",
      device_id: typeof deviceId === "string" ? deviceId.trim() : "",
      operator: typeof operator === "string" ? operator.trim() : "",
      notify_url: typeof notifyUrl === "string" ? notifyUrl.trim() : "",
      return_url: typeof returnUrl === "string" ? returnUrl.trim() : "",
      gateway_url: typeof gatewayUrl === "string" ? gatewayUrl.trim() : "",
      callback_public_key:
        typeof callbackPublicKey === "string" ? callbackPublicKey.trim() : "",
      test_mode: !!testMode,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1)
    .select(PAYMENT_SETTINGS_SELECT)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, data })
}
