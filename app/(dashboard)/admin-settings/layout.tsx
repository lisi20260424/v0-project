import { AdminSettingsNav } from "@/components/admin-settings/admin-settings-nav"
import { requireAdmin } from "@/lib/supabase/require-admin"

export default async function AdminSettingsLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <AdminSettingsNav />
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </div>
  )
}
