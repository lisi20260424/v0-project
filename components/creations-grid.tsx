"use client"

import * as React from "react"
import { ImageIcon, Loader2, Music2, Search, Video } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { platformAPI } from "@/lib/platform-api"

type TaskType = "video" | "image" | "music"
type TaskStatus = "queued" | "running" | "success" | "failed"
type CreationTask = {
  id: string
  type: TaskType | string
  prompt: string
  status: TaskStatus
  tool_label?: string
  model_name?: string
  cost?: number
  created_at?: string
  createdAt?: string
}

const TYPES: { value: TaskType | "all"; label: string; icon?: typeof Video }[] = [
  { value: "all", label: "全部" },
  { value: "video", label: "视频", icon: Video },
  { value: "image", label: "图像", icon: ImageIcon },
  { value: "music", label: "音乐", icon: Music2 },
]

const STATUS_LABEL: Record<string, string> = {
  queued: "排队中",
  running: "生成中",
  success: "已完成",
  failed: "失败",
}

export function CreationsGrid() {
  const [type, setType] = React.useState<TaskType | "all">("all")
  const [query, setQuery] = React.useState("")
  const [items, setItems] = React.useState<CreationTask[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const token = localStorage.getItem("accessToken") ?? ""
    if (!token) {
      setError("请先登录后查看创作记录")
      setLoading(false)
      return
    }
    platformAPI.listTasks(token)
      .then((data) => {
        setItems(data.data?.tasks ?? data.tasks ?? [])
        setError(null)
      })
      .catch((err) => setError(err instanceof Error ? err.message : "加载创作记录失败"))
      .finally(() => setLoading(false))
  }, [])

  const filtered = items.filter((item) => {
    const q = query.trim().toLowerCase()
    if (type !== "all" && item.type !== type) return false
    if (!q) return true
    return item.prompt.toLowerCase().includes(q) || (item.tool_label ?? item.model_name ?? item.type).toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">我的创作</h1>
        <p className="text-sm text-muted-foreground">这里展示 Go API 中持久化的生成任务和创作状态。</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={type} onValueChange={(v) => setType(v as TaskType | "all")}>
          <TabsList>
            {TYPES.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="gap-1.5 text-xs">
                {t.icon && <t.icon className="h-3.5 w-3.5" />}
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索提示词或模型" className="pl-8" />
        </div>
      </div>

      {loading ? <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />加载中...</div> : null}
      {error ? <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">{error}</div> : null}
      {!loading && !error && filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">暂无创作记录</div>
      ) : null}
      {filtered.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => <CreationCard key={item.id} item={item} />)}
        </div>
      ) : null}
    </div>
  )
}

function CreationCard({ item }: { item: CreationTask }) {
  const Icon = item.type === "video" ? Video : item.type === "music" ? Music2 : ImageIcon
  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{STATUS_LABEL[item.status] ?? item.status}</span>
              <span>{item.tool_label || item.model_name || item.type}</span>
              <span>{item.cost ?? 0} 点</span>
            </div>
            <p className="mt-2 line-clamp-3 text-sm">{item.prompt}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 border-t border-border pt-3 text-[11px] text-muted-foreground">{item.created_at || item.createdAt || item.id}</div>
    </article>
  )
}
