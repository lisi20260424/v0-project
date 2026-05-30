"use client"

import { Badge } from "@/components/ui/badge"

export type AdminPrompt = {
  id: string
  model_type: "video" | "image" | "music"
  title: string
  content: string
  category?: string | null
  enabled: boolean
  sort_order?: number
  created_at?: string
  updated_at?: string
}

export function PromptsManager({ initialPrompts }: { initialPrompts: AdminPrompt[] }) {
  if (!initialPrompts.length) return <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">暂无提示词配置</div>
  return <div className="grid gap-3">{initialPrompts.map((prompt) => <article key={prompt.id} className="rounded-xl border border-border bg-card p-5"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{prompt.title}</h3><Badge variant="secondary">{prompt.model_type}</Badge>{prompt.category && <Badge variant="outline">{prompt.category}</Badge>}{!prompt.enabled && <Badge variant="outline">停用</Badge>}</div><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{prompt.content}</p></article>)}</div>
}
