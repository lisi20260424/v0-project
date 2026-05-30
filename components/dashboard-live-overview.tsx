"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, ImageIcon, Music2, Sparkles, Video } from "lucide-react"
import { platformAPI } from "@/lib/platform-api"

type TaskStatus = "queued" | "running" | "success" | "failed"
type ApiTask = {
  id: string
  type: "image" | "video" | "music" | string
  prompt: string
  status: TaskStatus
  tool_label?: string
  model_name?: string
  cost?: number
  created_at?: string
}

const icons = {
  total: Sparkles,
  video: Video,
  image: ImageIcon,
  music: Music2,
}

export function DashboardLiveOverview() {
  const [tasks, setTasks] = React.useState<ApiTask[]>([])
  const [points, setPoints] = React.useState<number | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const token = localStorage.getItem("accessToken") ?? ""
    if (!token) {
      setError("登录后可查看任务统计、积分余额和最近创作。")
      return
    }
    Promise.all([platformAPI.listTasks(token), platformAPI.userPoints(token)])
      .then(([taskRes, pointRes]) => {
        setTasks(taskRes.data?.tasks ?? taskRes.tasks ?? [])
        setPoints(pointRes.points ?? pointRes.available ?? null)
        setError(null)
      })
      .catch((err) => setError(err instanceof Error ? err.message : "加载工作台数据失败"))
  }, [])

  const stats = [
    { key: "total", label: "本月创作", value: tasks.length, icon: icons.total },
    { key: "video", label: "视频作品", value: tasks.filter((task) => task.type === "video").length, icon: icons.video },
    { key: "image", label: "图像作品", value: tasks.filter((task) => task.type === "image").length, icon: icons.image },
    { key: "music", label: "音乐作品", value: tasks.filter((task) => task.type === "music").length, icon: icons.music },
  ]
  const activeTasks = tasks.filter((task) => task.status === "queued" || task.status === "running").slice(0, 3)
  const recentTasks = tasks.slice(0, 6)

  return (
    <div className="space-y-8">
      {error ? <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">{error}</div> : null}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.key} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums">{stat.value}</span>
              </div>
            </div>
          )
        })}
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">进行中的任务</h2>
          <Link href="/tasks" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            全部任务
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {activeTasks.length ? (
          <div className="grid gap-3 md:grid-cols-3">
            {activeTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            暂无进行中的任务
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">最近创作</h2>
          <Link href="/tasks" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            查看任务
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {recentTasks.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {recentTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            暂无创作记录
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-accent/5 p-6">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h3 className="text-lg font-bold">积分余额</h3>
            <p className="mt-1 text-sm text-muted-foreground">当前可用积分：{points ?? "-"} 点。充值和会员订单由 Go API 统一记录。</p>
          </div>
          <Link href="/billing" className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            查看账单
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}

function TaskCard({ task }: { task: ApiTask }) {
  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{task.status}</span>
        <span>{task.tool_label || task.model_name || task.type}</span>
        <span>{task.cost ?? 0} 点</span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm">{task.prompt}</p>
      <div className="mt-3 text-[11px] text-muted-foreground">{task.created_at || task.id}</div>
    </article>
  )
}
