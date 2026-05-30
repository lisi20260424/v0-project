"use client"

import { platformAuthFetch } from "@/lib/platform-session"

import * as React from "react"
import Image from "next/image"
import {
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  Copy,
  Trash2,
  Zap,
  Video,
  ImageIcon,
  Music2,
  Search,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type TaskType = "video" | "image" | "music"
type TaskStatus = "queued" | "running" | "success" | "failed"

type ApiTask = {
  id: string
  type: TaskType
  model_name: string
  provider_name: string | null
  tool_label: string | null
  prompt: string
  params: Record<string, any>
  status: TaskStatus
  progress: number
  result_urls: string[]
  cost: number
  error_message: string | null
  created_at: string
  completed_at: string | null
}

const TYPE_ICON: Record<TaskType, typeof Video> = {
  video: Video,
  image: ImageIcon,
  music: Music2,
}

const TYPE_LABEL: Record<TaskType, string> = {
  video: "视频",
  image: "图像",
  music: "音乐",
}

const STATUS_META: Record<
  TaskStatus,
  { label: string; icon: typeof Loader2; className: string; dotClass: string }
> = {
  queued: {
    label: "排队中",
    icon: Clock,
    className: "bg-muted text-muted-foreground",
    dotClass: "bg-muted-foreground",
  },
  running: {
    label: "生成中",
    icon: Loader2,
    className: "bg-primary/10 text-primary",
    dotClass: "bg-primary animate-pulse",
  },
  success: {
    label: "已完成",
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dotClass: "bg-emerald-500",
  },
  failed: {
    label: "失败",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive",
    dotClass: "bg-destructive",
  },
}

const FILTERS: { value: TaskStatus | "all"; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "running", label: "进行中" },
  { value: "success", label: "已完成" },
  { value: "failed", label: "失败" },
]

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
      d.getMinutes(),
    )}:${pad(d.getSeconds())}`
  } catch {
    return iso
  }
}

function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase()
}

export function TasksList() {
  const [filter, setFilter] = React.useState<TaskStatus | "all">("all")
  const [query, setQuery] = React.useState("")
  const [tasks, setTasks] = React.useState<ApiTask[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // 拉取任务列表
  const refresh = React.useCallback(async () => {
    try {
      const res = await platformAuthFetch("/v1/tasks", { cache: "no-store" })
      if (!res.ok) {
        throw new Error("加载任务失败")
      }
      const data = await res.json()
      setTasks(data.data?.tasks ?? data.tasks ?? [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  // 当存在 running/queued 任务时，每 5 秒刷新一次
  const hasPending = React.useMemo(
    () => tasks.some((t) => t.status === "running" || t.status === "queued"),
    [tasks],
  )

  React.useEffect(() => {
    if (!hasPending) return
    const timer = setInterval(refresh, 5000)
    return () => clearInterval(timer)
  }, [hasPending, refresh])

  // 对每个 running 任务单独触发一次轮询，让服务端去查上游
  React.useEffect(() => {
    const running = tasks.filter((t) => t.status === "running")
    if (running.length === 0) return
    const ids = running.map((t) => t.id)
    let cancelled = false
    ;(async () => {
      for (const id of ids) {
        if (cancelled) break
        try {
          const res = await platformAuthFetch(`/v1/tasks/${id}`, { cache: "no-store" })
          if (!res.ok) continue
          const json = await res.json()
          const task = json.data ?? json.task
          if (cancelled) break
          if (task) {
            setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...task } : t)))
          }
        } catch {
          // ignore
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [tasks])

  const filtered = React.useMemo(() => {
    return tasks.filter((t) => {
      if (filter !== "all") {
        if (filter === "running" && !["running", "queued"].includes(t.status)) return false
        if (filter !== "running" && t.status !== filter) return false
      }
      const q = query.trim().toLowerCase()
      if (q && !t.prompt.toLowerCase().includes(q) && !(t.tool_label ?? "").toLowerCase().includes(q)) {
        return false
      }
      return true
    })
  }, [tasks, filter, query])

  const stats = React.useMemo(
    () => ({
      running: tasks.filter((t) => t.status === "running" || t.status === "queued").length,
      success: tasks.filter((t) => t.status === "success").length,
      failed: tasks.filter((t) => t.status === "failed").length,
      spend: tasks.filter((t) => t.status === "success").reduce((sum, t) => sum + (t.cost ?? 0), 0),
    }),
    [tasks],
  )

  async function handleDelete(id: string) {
    if (!confirm("确认删除这条任务记录？")) return
    const prev = tasks
    setTasks((p) => p.filter((t) => t.id !== id))
    try {
      const res = await platformAuthFetch(`/v1/tasks/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("删除失败")
    } catch {
      setTasks(prev)
      toast.error("删除失败")
    }
  }

  async function handleCopyPrompt(prompt: string) {
    try {
      await navigator.clipboard.writeText(prompt)
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">我的任务</h1>
        <p className="mt-1 text-sm text-muted-foreground">查看所有正在进行和历史的生成任务，失败任务会自动退回点数。</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="进行中" value={stats.running} accent="text-primary" />
        <StatCard label="已完成" value={stats.success} accent="text-emerald-500" />
        <StatCard label="失败" value={stats.failed} accent="text-destructive" />
        <StatCard label="累计消耗" value={stats.spend} suffix="点" accent="text-accent" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as TaskStatus | "all")}>
          <TabsList>
            {FILTERS.map((f) => (
              <TabsTrigger key={f.value} value={f.value} className="text-xs">
                {f.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索提示词或模型"
            className="h-9 w-full pl-8 sm:w-64"
          />
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            加载中...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-12 text-center text-sm text-destructive">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <p className="text-sm text-muted-foreground">{tasks.length === 0 ? "还没有任务，去试试图片或视频生成吧" : "没有找到匹配的任务"}</p>
          </div>
        ) : (
          filtered.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onDelete={() => handleDelete(task.id)}
              onCopyPrompt={() => handleCopyPrompt(task.prompt)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  suffix,
  accent,
}: {
  label: string
  value: number
  suffix?: string
  accent: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-2xl font-bold tabular-nums", accent)}>
        {value}
        {suffix && <span className="ml-0.5 text-sm font-normal text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  )
}

function TaskRow({
  task,
  onDelete,
  onCopyPrompt,
}: {
  task: ApiTask
  onDelete: () => void
  onCopyPrompt: () => void
}) {
  const meta = STATUS_META[task.status]
  const StatusIcon = meta.icon
  const TypeIcon = TYPE_ICON[task.type]
  const firstUrl = task.result_urls?.[0]
  const isImage = task.type === "image"
  const isVideo = task.type === "video"
  const isMusic = task.type === "music"

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40">
      <div className="flex gap-4 p-4">
        <div className="relative aspect-square h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-secondary to-muted">
          {firstUrl && isImage ? (
            <Image
              src={firstUrl}
              alt={task.prompt}
              fill
              sizes="96px"
              className="object-cover"
              unoptimized
            />
          ) : firstUrl && isVideo ? (
            <video src={firstUrl} className="h-full w-full object-cover" muted playsInline />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              {task.status === "running" ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : (
                <TypeIcon className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
          )}
          {isVideo && task.status === "success" && (
            <div className="absolute bottom-1 right-1 rounded bg-background/70 px-1.5 py-0.5 text-[10px] font-medium backdrop-blur-sm">
              VIDEO
            </div>
          )}
          {isMusic && task.status === "success" && (
            <div className="absolute bottom-1 right-1 rounded bg-background/70 px-1.5 py-0.5 text-[10px] font-medium backdrop-blur-sm">
              AUDIO
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                meta.className,
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotClass)} />
              <StatusIcon className={cn("h-3 w-3", task.status === "running" && "animate-spin")} />
              {meta.label}
            </span>
            <span className="text-xs font-medium text-foreground">
              {task.tool_label || `${task.model_name} · ${TYPE_LABEL[task.type]}`}
            </span>
            <span className="text-xs text-muted-foreground">#{shortId(task.id)}</span>
            <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
              <Zap className="h-3 w-3 text-accent" fill="currentColor" />
              {task.cost} 点
            </span>
          </div>

          <p className="mt-2 line-clamp-2 text-sm text-foreground/85">{task.prompt}</p>

          {/* 音乐结果在行内提供播放器 */}
          {isMusic && firstUrl && task.status === "success" && (
            <audio src={firstUrl} controls className="mt-2 h-8 w-full max-w-md" />
          )}

          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
            <div className="text-xs text-muted-foreground">
              {formatDateTime(task.created_at)}
              {task.completed_at && task.status === "success" && (
                <span className="ml-2">· 完成 {formatDateTime(task.completed_at)}</span>
              )}
              {task.error_message && <span className="ml-2 text-destructive">· {task.error_message}</span>}
            </div>

            <div className="flex items-center gap-1">
              {task.status === "success" && firstUrl && (
                <>
                  <a
                    href={firstUrl}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Download className="h-3.5 w-3.5" />
                    下载
                  </a>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1 px-2 text-xs"
                    onClick={onCopyPrompt}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    复制提示词
                  </Button>
                </>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                aria-label="删除"
                onClick={onDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {task.status === "running" && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>生成进度</span>
                <span className="tabular-nums">{task.progress}%</span>
              </div>
              <Progress value={task.progress} className="mt-1 h-1" />
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
