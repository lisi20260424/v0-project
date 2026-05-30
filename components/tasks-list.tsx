"use client"

import * as React from "react"
import { Loader2, Search, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { platformAPI } from "@/lib/platform-api"

type TaskStatus = "queued" | "running" | "success" | "failed"
type ApiTask = { id: string; type: string; model_name?: string; tool_label?: string; prompt: string; status: TaskStatus; progress?: number; cost?: number; created_at?: string }

export function TasksList() {
  const [query, setQuery] = React.useState("")
  const [tasks, setTasks] = React.useState<ApiTask[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const refresh = React.useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken") ?? ""
      if (!token) throw new Error("请先登录后再试")
      const data = await platformAPI.listTasks(token)
      setTasks(data.data?.tasks ?? data.tasks ?? [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { refresh() }, [refresh])

  const filtered = tasks.filter((task) => {
    const q = query.trim().toLowerCase()
    return !q || task.prompt.toLowerCase().includes(q) || (task.tool_label ?? task.model_name ?? "").toLowerCase().includes(q)
  })

  async function remove(id: string) {
    const prev = tasks
    setTasks((items) => items.filter((item) => item.id !== id))
    try {
      const token = localStorage.getItem("accessToken") ?? ""
      if (!token) throw new Error("请先登录后再试")
      await platformAPI.deleteTask(token, id)
    } catch {
      setTasks(prev)
    }
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">我的任务</h1><p className="mt-1 text-sm text-muted-foreground">查看生成任务状态。</p></div>
      <div className="relative max-w-sm"><Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索提示词或模型" className="pl-8" /></div>
      {loading ? <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />加载中...</div> : null}
      {error ? <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">{error}</div> : null}
      {!loading && !error && filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">暂无任务</div> : null}
      <div className="space-y-3">{filtered.map((task) => <article key={task.id} className="rounded-2xl border border-border bg-card p-4"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>{task.status}</span><span>{task.tool_label || task.model_name || task.type}</span><span>{task.cost ?? 0} 点</span></div><p className="mt-2 line-clamp-2 text-sm">{task.prompt}</p></div><Button size="icon" variant="ghost" onClick={() => remove(task.id)}><Trash2 className="h-4 w-4" /></Button></div></article>)}</div>
    </div>
  )
}
