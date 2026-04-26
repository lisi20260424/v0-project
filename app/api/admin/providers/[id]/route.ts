import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/supabase/require-admin"

export const dynamic = "force-dynamic"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  await requireAdmin()
  const admin = createAdminClient()

  const form = await req.json()

  const updates: Record<string, unknown> = {}
  if (form.displayName !== undefined) updates.display_name = form.displayName
  if (form.description !== undefined) updates.description = form.description || null
  if (form.config !== undefined) updates.config = form.config
  if (form.enabled !== undefined) updates.enabled = form.enabled
  if (form.sortOrder !== undefined) updates.sort_order = form.sortOrder

  const { data, error } = await admin
    .from("admin_providers")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 400 })
  }

  return Response.json({ provider: data })
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin.from("admin_providers").delete().eq("id", params.id)

  if (error) {
    return Response.json({ error: error.message }, { status: 400 })
  }

  return Response.json({ success: true })
}
