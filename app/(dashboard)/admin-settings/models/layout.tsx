import { requireAdmin } from "@/lib/supabase/require-admin"

export default async function AdminSettingPageLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()

  return <>{children}</>
}
