import { SystemSettingsNav } from "@/components/admin-settings/system-settings-nav"

export const dynamic = "force-dynamic"

export default function SystemSettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6 lg:p-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">系统设置</h1>
        <p className="text-sm text-muted-foreground">
          配置 AI 网关、生成任务参数与支付方式
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <SystemSettingsNav />
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </div>
  )
}
