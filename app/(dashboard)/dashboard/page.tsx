import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Video, ImageIcon, Music2, Sparkles, AlertCircle, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MOCK_CREATIONS } from "@/lib/mock-data"
import { resolveIcon } from "@/lib/icon-map"
import { getDisplayTools } from "@/lib/display-tools"
import { USER_STATUS_LABELS, VIP_TIER_LABELS } from "@/lib/admin"

export const metadata = {
  title: "工作台 · 灵境 AI",
}

const quickStats = [
  { label: "本月创作", key: "total", icon: Sparkles },
  { label: "视频作品", key: "video", icon: Video },
  { label: "图像作品", key: "image", icon: ImageIcon },
  { label: "音乐作品", key: "music", icon: Music2 },
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
  const user: any = null
  const successTasks: Array<{ type: string }> = []
  const stats = {
    total: successTasks.length,
    video: successTasks.filter((t) => t.type === "video").length,
    image: successTasks.filter((t) => t.type === "image").length,
    music: successTasks.filter((t) => t.type === "music").length,
  }
  const runningTasks: any[] = []
  const tools = await getDisplayTools()

  const recentCreations = MOCK_CREATIONS.slice(0, 6)

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-end justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {greeting()}，{user?.displayName ?? "创作者"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">今天也是充满灵感的一天，来看看最新的工具吧。</p>
            
            {/* 用户状态和信息 */}
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              {/* 用户状态标签 */}
              {user?.status && (
                <Badge variant={user.status === "active" ? "default" : "destructive"} className="text-xs">
                  {USER_STATUS_LABELS[user.status as keyof typeof USER_STATUS_LABELS] || user.status}
                </Badge>
              )}
              
              {/* 会员等级 */}
              {user?.vipTier && (
                <Badge variant="secondary" className="text-xs">
                  {VIP_TIER_LABELS[user.vipTier as keyof typeof VIP_TIER_LABELS] || user.vipTier}
                </Badge>
              )}
              
              {/* 可用点数 */}
              <div className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium">
                <Zap className="h-3.5 w-3.5 text-accent" fill="currentColor" />
                <span className="tabular-nums">{user?.points?.toLocaleString() ?? 0}</span>
                <span className="text-muted-foreground">点</span>
              </div>
              
              {/* 禁用提示 */}
              {user?.status === "suspended" && (
                <div className="flex items-center gap-1 text-xs text-amber-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>账户已暂停，无法进行生成操作</span>
                </div>
              )}
              {user?.status === "banned" && (
                <div className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>账户已被禁用</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {quickStats.map((s) => {
            const Icon = s.icon
            const value = stats[s.key as keyof typeof stats]
            return (
              <div key={s.label} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tabular-nums">{value}</span>
                </div>
              </div>
            )
          })}
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
                {/* 底部渐变遮罩 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                
                {/* 内容 */}
                <div className="relative flex h-32 flex-col justify-between p-4">
                  {/* 图标 */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  
                  {/* 文字 */}
                  <div className="space-y-1">
                    <div className="font-bold text-white text-sm leading-tight">{t.name}</div>
                    {t.cost && <div className="text-xs text-white/80">{t.cost}</div>}
                  </div>
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
        {!runningTasks || runningTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            暂无进行中的任务
          </div>
        ) : (
          <div className="space-y-2">
            {runningTasks.map((t) => (
              <Link
                key={t.id}
                href={`/tasks#${t.id}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50"
              >
                <div className={`h-2 w-2 flex-shrink-0 rounded-full ${t.status === "running" ? "animate-pulse bg-primary" : "bg-muted-foreground"}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium">{t.tool_label || t.model_name}</span>
                    <span className="text-muted-foreground">#{t.id.slice(0, 8)}...</span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{t.prompt}</p>
                </div>
                <span className="flex-shrink-0 text-xs tabular-nums text-primary">
                  {t.status === "running" ? `${t.progress}%` : "排队中"}
                </span>
              </Link>
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
