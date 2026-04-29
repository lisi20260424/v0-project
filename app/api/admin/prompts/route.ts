import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdminUser, MODEL_TYPES } from "@/lib/admin"

async function ensureAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminUser(user)) return null
  return user
}

export async function GET() {
  const user = await ensureAdmin()
  if (!user) return NextResponse.json({ error: "无权限" }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("admin_prompts")
    .select("*")
    .order("model_type", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ prompts: data ?? [] })
}

export async function POST(request: Request) {
  const user = await ensureAdmin()
  if (!user) return NextResponse.json({ error: "无权限" }, { status: 403 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "参数无效" }, { status: 400 })
  }
  if (!MODEL_TYPES.includes(body.modelType)) {
    return NextResponse.json({ error: "模型类型无效" }, { status: 400 })
  }
  if (typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "请填写提示词标题" }, { status: 400 })
  }
  if (typeof body.content !== "string" || !body.content.trim()) {
    return NextResponse.json({ error: "请填写提示词内容" }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("admin_prompts")
    .insert({
      model_type: body.modelType,
      title: body.title.trim(),
      content: body.content.trim(),
      category: typeof body.category === "string" && body.category.trim() ? body.category.trim() : null,
      enabled: body.enabled !== false,
      sort_order: Number.isFinite(Number(body.sortOrder)) ? Math.floor(Number(body.sortOrder)) : 0,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ prompt: data })
}
