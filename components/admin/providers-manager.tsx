"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
import { ProviderDialog } from "@/components/admin/provider-dialog"

export type AdminProvider = {
  id: string
  name: string
  display_name: string
  description: string | null
  config: Record<string, unknown>
  enabled: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

type Banner = { ok: boolean; message: string } | null

export function ProvidersManager({ initialProviders }: { initialProviders: AdminProvider[] }) {
  const router = useRouter()
  const [providers, setProviders] = useState<AdminProvider[]>(initialProviders)
  const [editing, setEditing] = useState<AdminProvider | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminProvider | null>(null)
  const [banner, setBanner] = useState<Banner>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  function showBanner(b: Banner) {
    setBanner(b)
    if (b) setTimeout(() => setBanner(null), 3000)
  }

  async function handleSave(form: {
    id?: string
    name: string
    displayName: string
    description: string
    enabled: boolean
    sortOrder: number
  }) {
    const isEdit = !!form.id
    const url = isEdit ? `/api/admin/providers/${form.id}` : "/api/admin/providers"
    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    if (!res.ok) {
      throw new Error(json.error ?? "保存失败")
    }
    const saved = json.provider as AdminProvider
    setProviders((prev) => {
      const exists = prev.some((p) => p.id === saved.id)
      if (exists) return prev.map((p) => (p.id === saved.id ? saved : p))
      return [saved, ...prev]
    })
    showBanner({ ok: true, message: isEdit ? "供应商已更新" : "供应商已创建" })
    router.refresh()
  }

  async function handleToggle(provider: AdminProvider, enabled: boolean) {
    setPendingId(provider.id)
    try {
      const res = await fetch(`/api/admin/providers/${provider.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      })
      if (!res.ok) throw new Error("更新失败")
      setProviders((prev) => prev.map((p) => (p.id === provider.id ? { ...p, enabled } : p)))
      router.refresh()
    } catch (err) {
      showBanner({ ok: false, message: err instanceof Error ? err.message : "更新失败" })
    } finally {
      setPendingId(null)
    }
  }

  async function handleDelete(provider: AdminProvider) {
    setPendingId(provider.id)
    try {
      const res = await fetch(`/api/admin/providers/${provider.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("删除失败")
      setProviders((prev) => prev.filter((p) => p.id !== provider.id))
      showBanner({ ok: true, message: "供应商已删除" })
      router.refresh()
    } catch (err) {
      showBanner({ ok: false, message: err instanceof Error ? err.message : "删除失败" })
    } finally {
      setPendingId(null)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-4">
      {banner && (
        <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${banner.ok ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-700"}`}>
          {banner.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {banner.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">供应商列表</h2>
        <Button onClick={() => setCreating(true)} size="sm" className="h-8">
          <Plus className="h-4 w-4 mr-1" />
          新建供应商
        </Button>
      </div>

      <div className="space-y-2">
        {providers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            暂无供应商配置
          </div>
        ) : (
          providers.map((provider) => (
            <div key={provider.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{provider.display_name}</h3>
                  <Badge variant="secondary" className="text-[10px]">
                    {provider.name}
                  </Badge>
                  {provider.enabled ? (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-200 text-[10px]">
                      已启用
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">
                      已禁用
                    </Badge>
                  )}
                </div>
                {provider.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{provider.description}</p>}
              </div>

              <div className="flex items-center gap-3 ml-4">
                <Switch
                  checked={provider.enabled}
                  onCheckedChange={(enabled) => handleToggle(provider, enabled)}
                  disabled={pendingId === provider.id}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(provider)}
                  className="h-8 w-8 p-0"
                >
                  ✏️
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget(provider)}
                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <ProviderDialog
        open={creating || !!editing}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false)
            setEditing(null)
          }
        }}
        provider={editing || undefined}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除供应商</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除供应商 "{deleteTarget?.display_name}" 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && handleDelete(deleteTarget)}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
