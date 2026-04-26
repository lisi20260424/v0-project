import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/supabase/require-admin"

export const dynamic = "force-dynamic"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  await requireAdmin()
  const admin = createAdminClient()

  const form = await req.json()

  const { data, error } = await admin
    .from("admin_providers")
    .update({
      display_name: form.displayName,
      description: form.description || null,
      enabled: form.enabled,
      sort_order: form.sortOrder,
    })
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
