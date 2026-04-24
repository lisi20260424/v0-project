"use client"

import * as React from "react"
import Image from "next/image"
import { ImageIcon, Sparkles, Type, Upload, Wand2, Loader2, Crown, Info, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export type GeneratorModel = {
  id: string
  name: string
  tag?: string
  desc: string
  price: number // regular price per video in points
}

export type GeneratorRatio = {
  id: string
  label: string
  ratio: string
}

export type GeneratorOption = {
  id: string
  label: string
  desc?: string
}

export type VideoGeneratorProps = {
  models: GeneratorModel[]
  defaultModelId?: string
  ratios: GeneratorRatio[]
  durations?: GeneratorOption[]
  channels?: GeneratorOption[]
  counts?: number[]
  memberDiscount?: number // e.g., 0.75
  supportsImageToVideo?: boolean
  examplePrompts?: string[]
  accentLabel?: string // Prompt label emoji replacement (e.g., "◇", "✦")
}

const DEFAULT_COUNTS = [1, 3, 5, 10]
const DEFAULT_EXAMPLES = [
  "夜晚的东京街头，霓虹灯倒映在湿润的路面上，一只虎斑猫悠闲地踱步，镜头缓缓跟随",
  "一杯拿铁被缓缓倒入透明玻璃杯，奶泡形成爱心图案，微距特写，自然光",
  "中国水墨画风格，远山云海翻涌，一叶扁舟顺流而下，诗意悠远",
]

export function VideoGenerator({
  models,
  defaultModelId,
  ratios,
  durations,
  channels,
  counts = DEFAULT_COUNTS,
  memberDiscount = 0.75,
  supportsImageToVideo = true,
  examplePrompts = DEFAULT_EXAMPLES,
  accentLabel = "◇",
}: VideoGeneratorProps) {
  const [mode, setMode] = React.useState<"text" | "image">("text")
  const [prompt, setPrompt] = React.useState("")
  const [modelId, setModelId] = React.useState<string>(defaultModelId ?? models[0].id)
  const [ratioId, setRatioId] = React.useState<string>(ratios[0].id)
  const [durationId, setDurationId] = React.useState<string | undefined>(durations?.[0]?.id)
  const [channelId, setChannelId] = React.useState<string | undefined>(channels?.[0]?.id)
  const [count, setCount] = React.useState<number>(1)
  const [imageFile, setImageFile] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const model = models.find((m) => m.id === modelId) ?? models[0]
  const ratio = ratios.find((r) => r.id === ratioId) ?? ratios[0]
  const regular = model.price * count
  const member = Math.round(regular * memberDiscount)

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setImageFile(url)
  }

  const onGenerate = () => {
    if (!prompt.trim()) return
    setLoading(true)
    setTimeout(() => setLoading(false), 2200)
  }

  const aspectClass =
    ratio.ratio === "9:16"
      ? "aspect-[9/16] w-48"
      : ratio.ratio === "16:9"
      ? "aspect-video w-full"
      : ratio.ratio === "1:1"
      ? "aspect-square w-56"
      : "aspect-video w-full"

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      {/* Left: form */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
        {/* Mode switcher */}
        {supportsImageToVideo && (
          <div className="inline-flex rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => setMode("text")}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                mode === "text"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Type className="h-4 w-4" />
              文生视频
            </button>
            <button
              type="button"
              onClick={() => setMode("image")}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                mode === "image"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <ImageIcon className="h-4 w-4" />
              图生视频
            </button>
          </div>
        )}

        {/* Image upload */}
        {supportsImageToVideo && mode === "image" && (
          <div className="mt-4">
            <Label className="mb-2 block text-sm font-medium">参考图片</Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative flex min-h-32 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/40 transition-colors hover:border-primary/50 hover:bg-muted",
                imageFile && "border-solid",
              )}
            >
              {imageFile ? (
                <>
                  <Image
                    src={imageFile || "/placeholder.svg"}
                    alt="参考图片预览"
                    width={200}
                    height={200}
                    className="h-32 w-auto object-contain"
                    unoptimized
                  />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute right-2 top-2 h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation()
                      setImageFile(null)
                    }}
                    aria-label="移除图片"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 py-6 text-sm text-muted-foreground">
                  <Upload className="h-6 w-6" />
                  <span>点击上传图片 · PNG / JPG · 最大 10MB</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={onFileChange}
              />
            </div>
          </div>
        )}

        {/* Prompt */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <Label htmlFor="prompt" className="text-sm font-medium">
              <span className="mr-1 text-primary">{accentLabel}</span> 提示词
            </Label>
            <span className="text-xs tabular-nums text-muted-foreground">{prompt.length} / 5000</span>
          </div>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, 5000))}
            placeholder="描述你想要的画面，例如：镜头语言、主体、风格、光线、声音等。越详细，生成越精准。"
            className="min-h-[140px] resize-none bg-background"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {examplePrompts.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPrompt(p)}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <Sparkles className="mr-1 inline h-3 w-3 text-primary" />
                示例 {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Model */}
        <div className="mt-6">
          <Label className="mb-2 block text-sm font-medium">
            <span className="mr-1 text-primary">{accentLabel}</span> 模型版本
          </Label>
          <div className="grid gap-2 sm:grid-cols-3">
            {models.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setModelId(m.id)}
                className={cn(
                  "group rounded-lg border p-3 text-left transition-colors",
                  modelId === m.id ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{m.name}</span>
                  {m.tag && (
                    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      {m.tag}
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{m.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Channel (optional, e.g. Sora) */}
        {channels && channels.length > 0 && (
          <div className="mt-6">
            <Label className="mb-2 block text-sm font-medium">
              <span className="mr-1 text-primary">{accentLabel}</span> 选择渠道
            </Label>
            <div className="flex flex-wrap gap-2">
              {channels.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setChannelId(c.id)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm transition-colors",
                    channelId === c.id
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                  title={c.desc}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Ratio */}
        <div className="mt-6">
          <Label className="mb-2 block text-sm font-medium">
            <span className="mr-1 text-primary">{accentLabel}</span> 视频比例
          </Label>
          <div className="flex flex-wrap gap-2">
            {ratios.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRatioId(r.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                  ratioId === r.id
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "inline-block rounded-[3px] border-[1.5px] border-current",
                    r.ratio === "9:16" && "h-4 w-[9px]",
                    r.ratio === "16:9" && "h-[9px] w-4",
                    r.ratio === "1:1" && "h-3.5 w-3.5",
                  )}
                />
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration (optional) */}
        {durations && durations.length > 0 && (
          <div className="mt-6">
            <Label className="mb-2 block text-sm font-medium">
              <span className="mr-1 text-primary">{accentLabel}</span> 视频时长
            </Label>
            <div className="flex flex-wrap gap-2">
              {durations.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDurationId(d.id)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm transition-colors",
                    durationId === d.id
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Count */}
        <div className="mt-6">
          <Label className="mb-2 block text-sm font-medium">
            <span className="mr-1 text-primary">{accentLabel}</span> 生成数量
          </Label>
          <div className="flex flex-wrap gap-2">
            {counts.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCount(c)}
                className={cn(
                  "h-10 min-w-10 rounded-lg border px-3 text-sm font-medium transition-colors",
                  count === c
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Price + CTA */}
        <div className="mt-8 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm">
              <Crown className="h-3.5 w-3.5 text-accent" />
              <span className="text-muted-foreground">会员价</span>
              <span className="font-semibold tabular-nums">{member} 点</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>普通价</span>
              <span className="tabular-nums line-through">{regular} 点</span>
            </div>
          </div>
          <Button
            size="lg"
            onClick={onGenerate}
            disabled={loading || !prompt.trim() || (mode === "image" && !imageFile)}
            className="gap-2 sm:min-w-40"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                立即生成
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Right: preview */}
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium">实时预览</h3>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Info className="h-3 w-3" />
              配置摘要
            </span>
          </div>
          <div
            className={cn(
              "relative mx-auto flex items-center justify-center overflow-hidden rounded-xl border border-border bg-muted",
              aspectClass,
            )}
          >
            {loading ? (
              <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>排队生成中...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 px-4 text-center text-sm text-muted-foreground">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Wand2 className="h-4 w-4 text-primary" />
                </div>
                <span>输入提示词后开始生成</span>
              </div>
            )}
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
            {[
              ["模式", mode === "text" ? "文生视频" : "图生视频"],
              ["模型", model.name],
              ["比例", ratio.ratio],
              ...(durations && durationId ? [["时长", durations.find((d) => d.id === durationId)?.label ?? "-"]] : []),
              ...(channels && channelId ? [["渠道", channels.find((c) => c.id === channelId)?.label ?? "-"]] : []),
              ["数量", `${count} 条`],
            ].map(([k, v]) => (
              <div
                key={k as string}
                className="flex items-center justify-between rounded-md border border-border/60 bg-background px-3 py-2"
              >
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-accent/10 p-5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Crown className="h-4 w-4 text-accent" />
            升级会员 · 7.5 折省更多
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            会员可享所有模型 75 折、每日签到领点数、生成队列优先、支持私有模型定制。
          </p>
          <Button size="sm" variant="outline" className="mt-4 gap-1 bg-background/60">
            查看会员特权
          </Button>
        </div>
      </div>
    </div>
  )
}
