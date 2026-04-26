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
  if (typeof body.name === "string") update.name = body.name.trim()
  if (typeof body.provider === "string") update.provider = body.provider.trim()
  if (typeof body.modelType === "string") {
    if (!MODEL_TYPES.includes(body.modelType)) {
      return NextResponse.json({ error: "模型类型无效" }, { status: 400 })
    }
    update.model_type = body.modelType
  }
  if (body.costPerUse !== undefined) {
    const cost = Number(body.costPerUse)
    if (!Number.isFinite(cost) || cost < 0) {
      return NextResponse.json({ error: "单次消耗必须是非负数" }, { status: 400 })
    }
    update.cost_per_use = Math.floor(cost)
  }
  if (typeof body.description === "string" || body.description === null) {
    update.description = body.description
  }
  if (body.config && typeof body.config === "object") update.config = body.config
  if (typeof body.enabled === "boolean") update.enabled = body.enabled
  if (body.sortOrder !== undefined) {
    const so = Number(body.sortOrder)
    if (Number.isFinite(so)) update.sort_order = Math.floor(so)
  }

  const admin = createAdminClient()
  const { data, error } = await admin.from("admin_models").update(update).eq("id", id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ model: data })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await ensureAdmin()
  if (!user) return NextResponse.json({ error: "无权限" }, { status: 403 })

  const { id } = await params
  const admin = createAdminClient()
  const { error } = await admin.from("admin_models").delete().eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
