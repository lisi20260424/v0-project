"use client"

import * as React from "react"
import { Loader2, Wand2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useMembership } from "@/components/membership-provider"
import { useUser } from "@/components/user-provider"
import { platformAPI } from "@/lib/platform-api"
import type { MusicCapabilities } from "@/lib/model-capabilities"

export type MusicGeneratorModelData = {
  id: string
  name: string
  brand?: string
  desc: string
  price: number
  tag?: string
  capabilities: MusicCapabilities
}

export type MusicPromptChip = {
  id: string
  title: string
  content: string
  category?: string | null
}

export type MusicGeneratorProps = {
  models: MusicGeneratorModelData[]
  defaultModelId?: string
  activeProviderName?: string | null
  prompts?: MusicPromptChip[]
}

export function MusicGenerator({ models, defaultModelId, prompts = [] }: MusicGeneratorProps) {
  const { user } = useUser()
  const membership = useMembership()
  const [modelId, setModelId] = React.useState(defaultModelId ?? models[0]?.id ?? "")
  const [prompt, setPrompt] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const selected = models.find((model) => model.id === modelId) ?? models[0]

  async function onGenerate() {
    if (!selected || !prompt.trim()) return
    if (!user) {
      toast.error("请先登录")
      membership.open()
      return
    }
    const token = localStorage.getItem("accessToken") ?? ""
    if (!token) {
      toast.error("登录状态已失效，请重新登录")
      return
    }
    setLoading(true)
    try {
      await platformAPI.createTask(token, { type: "music", modelId: selected.id, prompt, params: { source: "music-page" } })
      toast.success("音乐任务已提交")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "提交失败")
    } finally {
      setLoading(false)
    }
  }

  if (!models.length) {
    return <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">暂无可用音乐模型。</div>
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="rounded-2xl border border-border bg-card p-5">
        <Label htmlFor="music-prompt">音乐描述</Label>
        <Textarea id="music-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="描述曲风、情绪、歌词方向、乐器和适用场景。" className="mt-2 min-h-40 resize-none bg-background" />
        {prompts.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {prompts.map((item) => (
              <button key={item.id} type="button" onClick={() => setPrompt(item.content)} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground">
                {item.title}
              </button>
            ))}
          </div>
        )}
        <Button className="mt-5 gap-2" onClick={onGenerate} disabled={loading || !prompt.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          提交音乐任务
        </Button>
      </section>
      <aside className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">模型</h2>
        <div className="mt-3 space-y-2">
          {models.map((model) => (
            <button key={model.id} type="button" onClick={() => setModelId(model.id)} className={`w-full rounded-lg border p-3 text-left text-sm ${modelId === model.id ? "border-primary bg-primary/5" : "border-border bg-background"}`}>
              <div className="font-medium">{model.name}</div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{model.desc}</p>
              <div className="mt-2 text-xs text-muted-foreground">{model.price} 点/次</div>
            </button>
          ))}
        </div>
      </aside>
    </div>
  )
}
