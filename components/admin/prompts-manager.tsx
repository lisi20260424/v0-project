"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PromptDialog } from "@/components/admin/prompt-dialog"
import { MODEL_TYPES, MODEL_TYPE_LABELS, type ModelType } from "@/lib/admin"

export type AdminPrompt = {
  id: string
  model_type: ModelType
  title: string
  content: string
  category: string | null
  enabled: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

type Banner = { ok: boolean; message: string } | null

export function PromptsManager({ initialPrompts }: { initialPrompts: AdminPrompt[] }) {
  const router = useRouter()
  const [prompts, setPrompts] = useState<AdminPrompt[]>(initialPrompts)
  const [activeType, setActiveType] = useState<ModelType>("video")
  const [editing, setEditing] = useState<AdminPrompt | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminPrompt | null>(null)
  const [banner, setBanner] = useState<Banner>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const grouped = useMemo(() => {
    const result: Record<ModelType, AdminPrompt[]> = { video: [], image: [], music: [] }
    for (const p of prompts) {
      if (result[p.model_type]) result[p.model_type].push(p)
    }
    return result
  }, [prompts])

  function showBanner(b: Banner) {
    setBanner(b)
    if (b) setTimeout(() => setBanner(null), 3000)
  }

  async function handleSave(form: {
    id?: string
    modelType: ModelType
    title: string
    content: string
    category: string
    enabled: boolean
    sortOrder: number
  }) {
    const isEdit = !!form.id
    const url = isEdit ? `/api/admin/prompts/${form.id}` : "/api/admin/prompts"
    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? "保存失败")
    const saved = json.prompt as AdminPrompt
    setPrompts((prev) => {
      const exists = prev.some((m) => m.id === saved.id)
      if (exists) return prev.map((m) => (m.id === saved.id ? saved : m))
      return [saved, ...prev]
    })
    showBanner({ ok: true, message: isEdit ? "提示词已更新" : "提示词已创建" })
    router.refresh()
  }

  async function handleToggle(prompt: AdminPrompt, enabled: boolean) {
    setPendingId(prompt.id)
    try {
      const res = await fetch(`/api/admin/prompts/${prompt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "更新失败")
      setPrompts((prev) => prev.map((m) => (m.id === prompt.id ? { ...m, enabled } : m)))
    } catch (err) {
      showBanner({ ok: false, message: err instanceof Error ? err.message : "更新失败" })
    } finally {
      setPendingId(null)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setPendingId(deleteTarget.id)
    try {
      const res = await fetch(`/api/admin/prompts/${deleteTarget.id}`, { method: "DELETE" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error ?? "删除失败")
      setPrompts((prev) => prev.filter((m) => m.id !== deleteTarget.id))
      showBanner({ ok: true, message: "提示词已删除" })
      router.refresh()
    } catch (err) {
      showBanner({ ok: false, message: err instanceof Error ? err.message : "删除失败" })
    } finally {
      setPendingId(null)
      setDeleteTarget(null)
    }
  }

  const visible = grouped[activeType]

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={activeType} onValueChange={(v) => setActiveType(v as ModelType)}>
          <TabsList>
            {MODEL_TYPES.map((t) => (
              <TabsTrigger key={t} value={t}>
                {MODEL_TYPE_LABELS[t]} ({grouped[t].length})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          新建提示词
        </Button>
      </div>

      {banner ? (
        <div
          className={
            banner.ok
              ? "flex items-start gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary"
              : "flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          }
        >
          {banner.ok ? (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          )}
          <span>{banner.message}</span>
        </div>
      ) : null}

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
          <p className="text-sm text-muted-foreground">
            {MODEL_TYPE_LABELS[activeType]} 还没有配置任何提示词
          </p>
          <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            新建提示词
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {visible.map((prompt) => (
            <article
              key={prompt.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 md:flex-row md:items-start md:justify-between"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold">{prompt.title}</h3>
                  {prompt.category ? (
                    <Badge variant="secondary" className="text-[11px]">
                      {prompt.category}
                    </Badge>
                  ) : null}
                  {!prompt.enabled ? (
                    <Badge variant="outline" className="border-muted-foreground/30 text-[11px] text-muted-foreground">
                      已停用
                    </Badge>
                  ) : null}
                </div>
                <p className="line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                  {prompt.content}
                </p>
                <p className="text-[11px] text-muted-foreground">排序：{prompt.sort_order}</p>
              </div>

              <div className="flex items-center gap-2 md:flex-col md:items-end">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={prompt.enabled}
                    disabled={pendingId === prompt.id}
                    onCheckedChange={(v) => handleToggle(prompt, v)}
                  />
                  <span className="text-xs text-muted-foreground">{prompt.enabled ? "启用" : "停用"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(prompt)}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">编辑</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(prompt)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">删除</span>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <PromptDialog
        open={creating}
        onOpenChange={setCreating}
        defaultModelType={activeType}
        onSave={handleSave}
      />

      <PromptDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        prompt={editing ?? undefined}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除提示词</AlertDialogTitle>
            <AlertDialogDescription>
              将永久删除「<span className="font-medium text-foreground">{deleteTarget?.title}</span>
              」。此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
