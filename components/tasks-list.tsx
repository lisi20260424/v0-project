"use client"

import * as React from "react"
import Image from "next/image"
import {
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Download,
  Copy,
  Trash2,
  Zap,
  Video,
  ImageIcon,
  Music2,
  MessageSquare,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MOCK_TASKS, type Task, type TaskStatus, type TaskType } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const TYPE_ICON: Record<TaskType, typeof Video> = {
  video: Video,
  image: ImageIcon,
  audio: Music2,
  chat: MessageSquare,
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

export function TasksList() {
  const [filter, setFilter] = React.useState<TaskStatus | "all">("all")
  const [query, setQuery] = React.useState("")

  const filtered = React.useMemo(() => {
    return MOCK_TASKS.filter((t) => {
      if (filter !== "all") {
        if (filter === "running" && !["running", "queued"].includes(t.status)) return false
        if (filter !== "running" && t.status !== filter) return false
      }
      if (query && !t.prompt.toLowerCase().includes(query.toLowerCase()) && !t.tool.includes(query)) {
        return false
      }
      return true
    })
  }, [filter, query])

  const stats = React.useMemo(
    () => ({
      running: MOCK_TASKS.filter((t) => t.status === "running" || t.status === "queued").length,
      success: MOCK_TASKS.filter((t) => t.status === "success").length,
      failed: MOCK_TASKS.filter((t) => t.status === "failed").length,
      spend: MOCK_TASKS.reduce((sum, t) => sum + t.cost, 0),
    }),
    [],
  )

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
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <p className="text-sm text-muted-foreground">没有找到匹配的任务</p>
          </div>
        ) : (
          filtered.map((task) => <TaskRow key={task.id} task={task} />)
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

function TaskRow({ task }: { task: Task }) {
  const meta = STATUS_META[task.status]
  const StatusIcon = meta.icon
  const TypeIcon = TYPE_ICON[task.type]

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40">
      <div className="flex gap-4 p-4">
        <div className="relative aspect-square h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-secondary to-muted">
          {task.thumbnail ? (
            <Image
              src={task.thumbnail || "/placeholder.svg"}
              alt={task.prompt}
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              {task.status === "running" ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : (
                <TypeIcon className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
          )}
          {task.type === "video" && task.status === "success" && (
            <div className="absolute bottom-1 right-1 rounded bg-background/70 px-1.5 py-0.5 text-[10px] font-medium backdrop-blur-sm">
              VIDEO
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", meta.className)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotClass)} />
              <StatusIcon className={cn("h-3 w-3", task.status === "running" && "animate-spin")} />
              {meta.label}
            </span>
            <span className="text-xs font-medium text-foreground">{task.tool}</span>
            <span className="text-xs text-muted-foreground">#{task.id}</span>
            <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
              <Zap className="h-3 w-3 text-accent" fill="currentColor" />
              {task.cost} 点
            </span>
          </div>

          <p className="mt-2 line-clamp-2 text-sm text-foreground/85">{task.prompt}</p>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
            <div className="text-xs text-muted-foreground">
              {task.createdAt}
              {task.duration && <span className="ml-2">· {task.duration}</span>}
              {task.errorMsg && <span className="ml-2 text-destructive">· {task.errorMsg}</span>}
            </div>

            <div className="flex items-center gap-1">
              {task.status === "success" && (
                <>
                  <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs">
                    <Download className="h-3.5 w-3.5" />
                    下载
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs">
                    <Copy className="h-3.5 w-3.5" />
                    复制提示词
                  </Button>
                </>
              )}
              {task.status === "failed" && (
                <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs bg-transparent">
                  <RotateCcw className="h-3.5 w-3.5" />
                  重新生成
                </Button>
              )}
              {(task.status === "running" || task.status === "queued") && (
                <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive">
                  取消任务
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                aria-label="删除"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {task.status === "running" && task.progress !== undefined && (
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
