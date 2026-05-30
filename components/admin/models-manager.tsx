"use client"

import { Badge } from "@/components/ui/badge"

export type AdminModel = {
  id: string
  name: string
  provider: string
  model_type: "video" | "image" | "music"
  billing_type?: string
  cost_per_use: number
  description?: string | null
  config?: Record<string, unknown>
  enabled: boolean
  sort_order?: number
  created_at?: string
  updated_at?: string
}

export function ModelsManager({ initialModels }: { initialModels: AdminModel[] }) {
  if (!initialModels.length) return <Empty text="暂无模型配置" />
  return <div className="grid gap-3">{initialModels.map((model) => <article key={model.id} className="rounded-xl border border-border bg-card p-5"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{model.name}</h3><Badge variant="secondary">{model.model_type}</Badge><Badge variant="outline">{model.provider}</Badge>{!model.enabled && <Badge variant="outline">停用</Badge>}</div><p className="mt-2 text-sm text-muted-foreground">{model.description || "暂无描述"}</p><div className="mt-3 text-xs text-muted-foreground">单次消耗：{model.cost_per_use} 点</div></article>)}</div>
}

function Empty({ text }: { text: string }) { return <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">{text}</div> }
