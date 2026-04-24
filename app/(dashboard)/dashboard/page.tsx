import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Video, ImageIcon, Music2, Sparkles, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TOOLS } from "@/lib/tools"
import { MOCK_CREATIONS, MOCK_TASKS } from "@/lib/mock-data"
import { getCurrentUser } from "@/lib/supabase/get-user"

export const metadata = {
  title: "工作台 · 灵境 AI",
}

const quickStats = [
  { label: "本月创作", value: 42, trend: "+18%", icon: Sparkles },
  { label: "视频作品", value: 12, trend: "+3", icon: Video },
  { label: "图像作品", value: 26, trend: "+12", icon: ImageIcon },
  { label: "音乐作品", value: 4, trend: "+1", icon: Music2 },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 6) return "夜深了"
  if (h < 12) return "早上好"
  if (h < 14) return "中午好"
  if (h < 18) return "下午好"
  return "晚上好"
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const runningTasks = MOCK_TASKS.filter((t) => t.status === "running" || t.status === "queued")
  const recentCreations = MOCK_CREATIONS.slice(0, 6)

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {greeting()}，{user?.displayName ?? "创作者"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">今天也是充满灵感的一天，来看看最新的工具吧。</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {quickStats.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tabular-nums">{s.value}</span>
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-500">
                    <TrendingUp className="h-3 w-3" />
                    {s.trend}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">开始创作</h2>
          <Link href="/#tools" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            全部工具
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {TOOLS.slice(0, 8).map((t) => {
            const Icon = t.icon
            return (
              <Link
                key={t.id}
                href={t.href}
                className={`group flex items-center gap-3 rounded-xl border border-border bg-gradient-to-br ${t.accent} p-3 transition-all hover:border-primary/40 hover:shadow-sm`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background/60 backdrop-blur-sm">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{t.name}</div>
                  <div className="truncate text-[10px] text-muted-foreground">{t.cost}</div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">进行中的任务</h2>
          <Link href="/tasks" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            全部任务
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {runningTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            暂无进行中的任务
          </div>
        ) : (
          <div className="space-y-2">
            {runningTasks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                <div className="h-2 w-2 flex-shrink-0 animate-pulse rounded-full bg-primary" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium">{t.tool}</span>
                    <span className="text-muted-foreground">#{t.id}</span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{t.prompt}</p>
                </div>
                <span className="flex-shrink-0 text-xs tabular-nums text-primary">
                  {t.status === "running" ? `${t.progress}%` : "排队中"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">最近创作</h2>
          <Link href="/creations" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            全部创作
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
          {recentCreations.map((c) => (
            <Link key={c.id} href="/creations" className="group relative aspect-square overflow-hidden rounded-lg">
              <Image
                src={c.cover || "/placeholder.svg"}
                alt={c.title}
                fill
                sizes="120px"
                className="object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="absolute inset-x-1 bottom-1 line-clamp-1 text-[10px] font-medium text-foreground opacity-0 transition-opacity group-hover:opacity-100">
                {c.title}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-accent/5 p-6">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h3 className="text-lg font-bold">升级到 Pro，享更多创作自由</h3>
            <p className="mt-1 text-sm text-muted-foreground">作品永久保留、高清导出、优先队列、商业授权</p>
          </div>
          <Button asChild size="lg">
            <Link href="/pricing">
              立即升级
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
