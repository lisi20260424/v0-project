import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdminEmail } from "@/lib/admin"

async function ensureAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return null
  }
  return user
}

export async function PUT(request: Request) {
  const user = await ensureAdmin()
  if (!user) {
    return NextResponse.json({ error: "无权限" }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body.gatewayUrl !== "string") {
    return NextResponse.json({ error: "参数无效" }, { status: 400 })
  }

  const apiKey = typeof body.apiKey === "string" ? body.apiKey : ""
  const gatewayUrl = body.gatewayUrl.trim()

  if (gatewayUrl) {
    try {
      // 验证 URL 格式
      // eslint-disable-next-line no-new
      new URL(gatewayUrl)
    } catch {
      return NextResponse.json({ error: "网关地址格式无效" }, { status: 400 })
    }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from("admin_gateway_settings")
    .update({
      api_key: apiKey,
      gateway_url: gatewayUrl,
      updated_by: user.id,
    })
    .eq("id", 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
