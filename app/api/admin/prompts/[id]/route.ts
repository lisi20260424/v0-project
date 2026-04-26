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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await ensureAdmin()
  if (!user) return NextResponse.json({ error: "无权限" }, { status: 403 })

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "参数无效" }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  if (typeof body.modelType === "string") {
    if (!MODEL_TYPES.includes(body.modelType)) {
      return NextResponse.json({ error: "模型类型无效" }, { status: 400 })
    }
    update.model_type = body.modelType
  }
  if (typeof body.title === "string") update.title = body.title.trim()
  if (typeof body.content === "string") update.content = body.content.trim()
  if (body.category === null || typeof body.category === "string") {
    update.category = body.category ? String(body.category).trim() : null
  }
  if (typeof body.enabled === "boolean") update.enabled = body.enabled
  if (body.sortOrder !== undefined) {
    const so = Number(body.sortOrder)
    if (Number.isFinite(so)) update.sort_order = Math.floor(so)
  }

  const admin = createAdminClient()
  const { data, error } = await admin.from("admin_prompts").update(update).eq("id", id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ prompt: data })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await ensureAdmin()
  if (!user) return NextResponse.json({ error: "无权限" }, { status: 403 })

  const { id } = await params
  const admin = createAdminClient()
  const { error } = await admin.from("admin_prompts").delete().eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
