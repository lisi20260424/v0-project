import { AdminSettingsNav } from "@/components/admin/admin-settings-nav"
import { requireAdmin } from "@/lib/supabase/require-admin"

export default async function AdminSettingsLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6 lg:p-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">后台设置</h1>
        <p className="text-sm text-muted-foreground">管理 API 网关、模型配置和提示词</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <AdminSettingsNav />
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </div>
  )
}
