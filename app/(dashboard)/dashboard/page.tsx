import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { resolveIcon } from "@/lib/icon-map"
import { getDisplayTools } from "@/lib/display-tools"
import { DashboardLiveOverview } from "@/components/dashboard-live-overview"

export const metadata = {
  title: "工作台 | 灵境 AI",
}

function greeting() {
  const h = new Date().getHours()
  if (h < 6) return "夜深了"
  if (h < 12) return "早上好"
  if (h < 14) return "中午好"
  if (h < 18) return "下午好"
  return "晚上好"
}

export default async function DashboardPage() {
  const tools = await getDisplayTools()

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-end justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{greeting()}，开始创作吧</h1>
            <p className="mt-1 text-sm text-muted-foreground">任务、积分和账单数据由 Go API 实时提供。</p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">开始创作</h2>
          <Link href="/#tools" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            全部工具
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {tools.slice(0, 8).map((t) => {
            const Icon = resolveIcon(t.icon)
            return (
              <Link
                key={t.id}
                href={t.href}
                className={`group relative overflow-hidden rounded-2xl border border-border/20 bg-gradient-to-br ${t.accent} transition-all hover:border-white/30 hover:shadow-lg`}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="relative flex h-32 flex-col justify-between p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-bold leading-tight text-white">{t.name}</div>
                    {t.cost && <div className="text-xs text-white/80">{t.cost}</div>}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <DashboardLiveOverview />
    </div>
  )
}
