"use client"

import { Badge } from "@/components/ui/badge"

export type AdminProvider = {
  id: string
  name: string
  display_name: string
  description?: string | null
  config?: Record<string, unknown>
  enabled: boolean
  sort_order?: number
  created_at?: string
  updated_at?: string
}

export function ProvidersManager({ initialProviders }: { initialProviders: AdminProvider[] }) {
  if (!initialProviders.length) return <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">暂无供应商配置</div>
  return <div className="grid gap-3">{initialProviders.map((provider) => <article key={provider.id} className="rounded-xl border border-border bg-card p-5"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{provider.display_name || provider.name}</h3><Badge variant="outline">{provider.name}</Badge>{provider.enabled ? <Badge>启用</Badge> : <Badge variant="outline">停用</Badge>}</div><p className="mt-2 text-sm text-muted-foreground">{provider.description || "暂无描述"}</p></article>)}</div>
}
