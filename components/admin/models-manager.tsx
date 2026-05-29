"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
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
import { ModelDialog } from "@/components/admin/model-dialog"
import { MODEL_TYPES, MODEL_TYPE_LABELS, BILLING_TYPE_LABELS, type ModelType } from "@/lib/admin"

export type AdminModel = {
  id: string
  name: string
  provider: string
  model_type: ModelType
  billing_type: string
  cost_per_use: number
  description: string | null
  config: Record<string, unknown>
  enabled: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

type Banner = { ok: boolean; message: string } | null

export function ModelsManager({ initialModels }: { initialModels: AdminModel[] }) {
  const router = useRouter()
  const [models, setModels] = useState<AdminModel[]>(initialModels)
  const [activeTab, setActiveTab] = useState<ModelType | "all">("all")
  const [editing, setEditing] = useState<AdminModel | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminModel | null>(null)
  const [banner, setBanner] = useState<Banner>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const grouped = useMemo(() => {
    const result: Record<ModelType, AdminModel[]> = { video: [], image: [], music: [] }
    for (const m of models) {
      if (result[m.model_type]) result[m.model_type].push(m)
    }
    return result
  }, [models])

  function showBanner(b: Banner) {
    setBanner(b)
    if (b) setTimeout(() => setBanner(null), 3000)
  }

  async function handleSave(form: {
    id?: string
    name: string
    provider: string
    modelType: ModelType
    costPerUse: number
    description: string
    config: Record<string, unknown>
    enabled: boolean
    sortOrder: number
  }) {
    const isEdit = !!form.id
    const url = isEdit ? `/v1/admin/models/${form.id}` : "/v1/admin/models"
    const token = localStorage.getItem("accessToken") ?? ""
    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    if (!res.ok) {
      throw new Error(json.error ?? "淇濆瓨澶辫触")
    }
    const saved = json.model as AdminModel
    setModels((prev) => {
      const exists = prev.some((m) => m.id === saved.id)
      if (exists) return prev.map((m) => (m.id === saved.id ? saved : m))
      return [saved, ...prev]
    })
    showBanner({ ok: true, message: isEdit ? "妯″瀷宸叉洿鏂? : "妯″瀷宸插垱寤? })
    router.refresh()
  }

  async function handleToggle(model: AdminModel, enabled: boolean) {
    setPendingId(model.id)
    try {
      const token = localStorage.getItem("accessToken") ?? ""
      const res = await fetch(`/v1/admin/models/${model.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ enabled }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "鏇存柊澶辫触")
      setModels((prev) => prev.map((m) => (m.id === model.id ? { ...m, enabled } : m)))
    } catch (err) {
      showBanner({ ok: false, message: err instanceof Error ? err.message : "鏇存柊澶辫触" })
    } finally {
      setPendingId(null)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setPendingId(deleteTarget.id)
    try {
      const token = localStorage.getItem("accessToken") ?? ""
      const res = await fetch(`/v1/admin/models/${deleteTarget.id}`, { method: "DELETE", headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error ?? "鍒犻櫎澶辫触")
      setModels((prev) => prev.filter((m) => m.id !== deleteTarget.id))
      showBanner({ ok: true, message: "妯″瀷宸插垹闄? })
      router.refresh()
    } catch (err) {
      showBanner({ ok: false, message: err instanceof Error ? err.message : "鍒犻櫎澶辫触" })
    } finally {
      setPendingId(null)
      setDeleteTarget(null)
    }
  }

  const visible: AdminModel[] = activeTab === "all" ? models : grouped[activeTab]

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ModelType | "all")}>
          <TabsList>
            <TabsTrigger value="all">鍏ㄩ儴 ({models.length})</TabsTrigger>
            {MODEL_TYPES.map((t) => (
              <TabsTrigger key={t} value={t}>
                {MODEL_TYPE_LABELS[t]} ({grouped[t].length})
              </TabsTrigger>
            ))}
          </TabsList>
          {MODEL_TYPES.map((t) => (
            <TabsContent key={t} value={t} className="hidden" />
          ))}
        </Tabs>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          鏂板缓妯″瀷
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
          <p className="text-sm text-muted-foreground">杩樻病鏈夐厤缃换浣曟ā鍨?/p>
          <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            鏂板缓妯″瀷
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {visible.map((model) => (
            <article
              key={model.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 md:flex-row md:items-start md:justify-between"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold">{model.name}</h3>
                  <Badge variant="secondary" className="text-[11px]">
                    {MODEL_TYPE_LABELS[model.model_type]}
                  </Badge>
                  <Badge variant="outline" className="text-[11px]">
                    {model.provider}
                  </Badge>
                  {!model.enabled ? (
                    <Badge variant="outline" className="border-muted-foreground/30 text-[11px] text-muted-foreground">
                      宸插仠鐢?
                    </Badge>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>璁¤垂锛歿BILLING_TYPE_LABELS[model.billing_type] ?? model.billing_type}</span>
                  <span>
                    鍗曟娑堣€楋細<span className="font-medium text-foreground">{model.cost_per_use} 鐐?/span>
                  </span>
                  <span>鎺掑簭锛歿model.sort_order}</span>
                </div>
                {model.description ? (
                  <p className="text-xs leading-relaxed text-muted-foreground">{model.description}</p>
                ) : null}
                {Object.keys(model.config ?? {}).length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {Object.entries(model.config).map(([k, v]) => (
                      <span
                        key={k}
                        className="rounded-md border border-border bg-secondary/50 px-2 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {k}: {String(v)}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-2 md:flex-col md:items-end">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={model.enabled}
                    disabled={pendingId === model.id}
                    onCheckedChange={(v) => handleToggle(model, v)}
                  />
                  <span className="text-xs text-muted-foreground">{model.enabled ? "鍚敤" : "鍋滅敤"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(model)}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">缂栬緫</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(model)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">鍒犻櫎</span>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ModelDialog
        open={creating}
        onOpenChange={setCreating}
        defaultModelType={activeTab === "all" ? "video" : activeTab}
        onSave={handleSave}
      />

      <ModelDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        model={editing ?? undefined}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>纭鍒犻櫎妯″瀷</AlertDialogTitle>
            <AlertDialogDescription>
              灏嗘案涔呭垹闄ゆā鍨?<span className="font-medium text-foreground">{deleteTarget?.name}</span>
              銆傛鎿嶄綔鏃犳硶鎾ら攢銆?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>鍙栨秷</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              纭鍒犻櫎
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}


