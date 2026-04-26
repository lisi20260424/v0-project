import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdminEmail, MODEL_TYPES } from "@/lib/admin"

async function ensureAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) return null
  return user
}

function validateBody(body: any) {
  if (!body || typeof body !== "object") return "参数无效"
  if (typeof body.name !== "string" || !body.name.trim()) return "请填写模型名称"
  if (typeof body.provider !== "string" || !body.provider.trim()) return "请填写模型供应商"
  if (!MODEL_TYPES.includes(body.modelType)) return "模型类型无效"
  const cost = Number(body.costPerUse)
  if (!Number.isFinite(cost) || cost < 0) return "单次消耗必须是非负数"
  return null
}

export async function GET() {
  const user = await ensureAdmin()
  if (!user) return NextResponse.json({ error: "无权限" }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("admin_models")
    .select("*")
    .order("model_type", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ models: data ?? [] })
}

export async function POST(request: Request) {
  const user = await ensureAdmin()
  if (!user) return NextResponse.json({ error: "无权限" }, { status: 403 })

  const body = await request.json().catch(() => null)
  const err = validateBody(body)
  if (err) return NextResponse.json({ error: err }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("admin_models")
    .insert({
      name: String(body.name).trim(),
      provider: String(body.provider).trim(),
      model_type: body.modelType,
      billing_type: "per_use",
      cost_per_use: Math.floor(Number(body.costPerUse)),
      description: typeof body.description === "string" ? body.description : null,
      config: body.config && typeof body.config === "object" ? body.config : {},
      enabled: body.enabled !== false,
      sort_order: Number.isFinite(Number(body.sortOrder)) ? Math.floor(Number(body.sortOrder)) : 0,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ model: data })
}
