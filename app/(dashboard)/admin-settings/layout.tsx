import { AdminSettingsNav } from "@/components/admin-settings/admin-settings-nav"
import { requireAdmin } from "@/lib/supabase/require-admin"

export default async function AdminSettingsLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()

  return <>{children}</>
}
