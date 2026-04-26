import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/supabase/require-admin"

export const dynamic = "force-dynamic"

export async function GET() {
  await requireAdmin()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from("admin_providers")
    .select("*")
    .eq("enabled", true)
    .order("sort_order", { ascending: true })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ providers: data ?? [] })
}

export async function POST(req: Request) {
  await requireAdmin()
  const admin = createAdminClient()

  const form = await req.json()
  const { data: { user } } = await admin.auth.getUser()

  const { data, error } = await admin
    .from("admin_providers")
    .insert([
      {
        name: form.name,
        display_name: form.displayName,
        description: form.description || null,
        enabled: form.enabled ?? true,
        sort_order: form.sortOrder ?? 0,
        created_by: user?.id,
      },
    ])
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 400 })
  }

  return Response.json({ provider: data })
}
