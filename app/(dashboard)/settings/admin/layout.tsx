import { requireAdmin } from "@/lib/supabase/require-admin"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  return <>{children}</>
}
