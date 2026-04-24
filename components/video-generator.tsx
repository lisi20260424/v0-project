"use client"

import * as React from "react"
import Image from "next/image"
import {
  ImageIcon,
  Sparkles,
  Type,
  Upload,
  Wand2,
  Loader2,
  Crown,
  Info,
  X,
  Film,
  Images,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export type GeneratorModel = {
  id: string
  name: string
  tag?: string
  desc: string
  price: number
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

/**
 * Image-to-video mode capability per tool:
 *  - "frames"   Veo-style: 「首尾帧」+ 「多图参考」双子模式
 *  - "single"   Grok-style: 只支持 1 张参考图
 */
export type ImageCapability = "frames" | "single"

export type VideoGeneratorProps = {
  models: GeneratorModel[]
  defaultModelId?: string
  ratios: GeneratorRatio[]
  durations?: GeneratorOption[]
  channels?: GeneratorOption[]
  counts?: number[]
  memberDiscount?: number
  supportsImageToVideo?: boolean
  imageCapability?: ImageCapability
  multiImageSlots?: number
  examplePrompts?: string[]
  accentLabel?: string
}

const DEFAULT_COUNTS = [1, 3, 5, 10]
const DEFAULT_EXAMPLES = [
  "夜晚的东京街头，霓虹灯倒映在湿润的路面上，一只虎斑猫悠闲地踱步，镜头缓缓跟随",
  "一杯拿铁被缓缓倒入透明玻璃杯，奶泡形成爱心图案，微距特写，自然光",
  "中国水墨画风格，远山云海翻涌，一叶扁舟顺流而下，诗意悠远",
]

type UploadSlotProps = {
  label: string
  hint?: string
  value: string | null
  onChange: (v: string | null) => void
  className?: string
}

function UploadSlot({ label, hint, value, onChange, className }: UploadSlotProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    onChange(URL.createObjectURL(f))
    e.target.value = ""
  }
  return (
    <div
      onClick={() => inputRef.current?.click()}
      className={cn(
        "group relative flex aspect-square min-h-32 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/40 transition-colors hover:border-primary/50 hover:bg-muted",
        value && "border-solid",
        className,
      )}
    >
      {value ? (
        <>
          <Image
            src={value || "/placeholder.svg"}
            alt="参考图片预览"
            fill
            className="object-cover"
            unoptimized
          />
          <button
            type="button"
            aria-label="移除图片"
            onClick={(e) => {
              e.stopPropagation()
              onChange(null)
            }}
            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-muted-foreground backdrop-blur transition-colors hover:bg-background hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center gap-1.5 px-2 text-center text-xs text-muted-foreground">
          <Upload className="h-5 w-5" />
          <span className="font-medium text-foreground/80">{label}</span>
          {hint && <span className="text-[10px] leading-tight text-muted-foreground">{hint}</span>}
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onFile} />
    </div>
  )
}

export function VideoGenerator({
  models,
  defaultModelId,
  ratios,
  durations,
  channels,
  counts = DEFAULT_COUNTS,
  memberDiscount = 0.75,
  supportsImageToVideo = true,
  imageCapability = "frames",
  multiImageSlots = 3,
  examplePrompts = DEFAULT_EXAMPLES,
  accentLabel = "◇",
}: VideoGeneratorProps) {
  const [mode, setMode] = React.useState<"text" | "image">("text")
  const [imageSubMode, setImageSubMode] = React.useState<"frames" | "multi">("frames")
  const [prompt, setPrompt] = React.useState("")
  const [modelId, setModelId] = React.useState<string>(defaultModelId ?? models[0].id)
  const [ratioId, setRatioId] = React.useState<string>(ratios[0].id)
  const [durationId, setDurationId] = React.useState<string | undefined>(durations?.[0]?.id)
  const [channelId, setChannelId] = React.useState<string | undefined>(channels?.[0]?.id)
  const [count, setCount] = React.useState<number>(1)

  // Unified image state
  const [frameStart, setFrameStart] = React.useState<string | null>(null)
  const [frameEnd, setFrameEnd] = React.useState<string | null>(null)
  const [multiImages, setMultiImages] = React.useState<(string | null)[]>(() => Array(multiImageSlots).fill(null))
  const [singleImage, setSingleImage] = React.useState<string | null>(null)

  const [loading, setLoading] = React.useState(false)

  const model = models.find((m) => m.id === modelId) ?? models[0]
  const ratio = ratios.find((r) => r.id === ratioId) ?? ratios[0]
  const regular = model.price * count
  const member = Math.round(regular * memberDiscount)

  // Whether the user has provided any reference image in current sub-mode
  const hasImage =
    imageCapability === "single"
      ? !!singleImage
      : imageSubMode === "frames"
        ? !!frameStart
        : multiImages.some((u) => !!u)

  // When using single-image mode (e.g., Grok), hide ratio picker in image-to-video
  // because the video size follows the uploaded image.
  const hideRatioInImageMode = imageCapability === "single" && mode === "image"

  const onGenerate = () => {
    if (!prompt.trim()) return
    if (mode === "image" && !hasImage) return
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

  const updateMultiAt = (i: number, v: string | null) => {
    setMultiImages((prev) => {
      const next = prev.slice()
      next[i] = v
      return next
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
        {/* Primary mode switcher */}
        {supportsImageToVideo && (
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1 sm:inline-grid sm:w-auto sm:grid-cols-[auto_auto]">
            <button
              type="button"
              onClick={() => setMode("text")}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-colors",
                mode === "text"
                  ? "bg-primary text-primary-foreground shadow-sm"
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
                "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-colors",
                mode === "image"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <ImageIcon className="h-4 w-4" />
              图生视频
            </button>
          </div>
        )}

        {/* Image-to-video upload section */}
        {supportsImageToVideo && mode === "image" && (
          <div className="mt-4">
            {imageCapability === "frames" && (
              <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-muted p-1 sm:inline-grid sm:w-auto sm:grid-cols-[auto_auto]">
                <button
                  type="button"
                  onClick={() => setImageSubMode("frames")}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-colors",
                    imageSubMode === "frames"
                      ? "bg-primary/15 text-primary ring-1 ring-primary/40"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Film className="h-4 w-4" />
                  首尾帧
                </button>
                <button
                  type="button"
                  onClick={() => setImageSubMode("multi")}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-colors",
                    imageSubMode === "multi"
                      ? "bg-primary/15 text-primary ring-1 ring-primary/40"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Images className="h-4 w-4" />
                  多图参考
                </button>
              </div>
            )}

            {imageCapability === "single" && (
              <div>
                <Label className="mb-1 block text-sm font-medium">
                  <span className="mr-1 text-primary">{accentLabel}</span> 参考图片
                </Label>
                <p className="mb-3 text-xs text-primary/90">上传图片后，视频尺寸将跟随图片尺寸</p>
                <SingleUpload value={singleImage} onChange={setSingleImage} />
              </div>
            )}

            {imageCapability === "frames" && imageSubMode === "frames" && (
              <div>
                <Label className="mb-3 block text-sm font-medium">
                  <span className="mr-1 text-primary">{accentLabel}</span> 首尾帧
                </Label>
                <div className="flex items-center gap-2">
                  <UploadSlot label="上传首帧" value={frameStart} onChange={setFrameStart} className="flex-1" />
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                  <UploadSlot label="上传尾帧" hint="选填" value={frameEnd} onChange={setFrameEnd} className="flex-1" />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">仅上传首帧可生成自然过渡；提供尾帧将引导镜头终点画面</p>
              </div>
            )}

            {imageCapability === "frames" && imageSubMode === "multi" && (
              <div>
                <Label className="mb-3 block text-sm font-medium">
                  <span className="mr-1 text-primary">{accentLabel}</span> 参考图
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {multiImages.map((img, i) => (
                    <UploadSlot
                      key={i}
                      label={i === 0 ? "上传图片" : "上传图片"}
                      hint={i === 0 ? undefined : "选填"}
                      value={img}
                      onChange={(v) => updateMultiAt(i, v)}
                    />
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">最多上传 {multiImageSlots} 张参考图，综合引导画面风格与主体</p>
              </div>
            )}
          </div>
        )}

        {/* Prompt */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <Label htmlFor="prompt" className="text-sm font-medium">
              <span className="mr-1 text-primary">{accentLabel}</span>{" "}
              {mode === "image" ? "描述您的视频场景" : "提示词"}
            </Label>
            <span className="text-xs tabular-nums text-muted-foreground">{prompt.length} / 5000</span>
          </div>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, 5000))}
            placeholder={
              mode === "image"
                ? "结合图片，描述你想生成的画面…"
                : "描述你想要的画面，例如：镜头语言、主体、风格、光线、声音等。越详细，生成越精准。"
            }
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
                  modelId === m.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:border-primary/40",
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

        {/* Channel */}
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

        {/* Ratio (hidden when single-image-to-video since size follows image) */}
        {!hideRatioInImageMode && (
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
        )}

        {/* Duration */}
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
            disabled={loading || !prompt.trim() || (mode === "image" && !hasImage)}
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

      {/* Preview */}
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
              [
                "模式",
                mode === "text"
                  ? "文生视频"
                  : imageCapability === "single"
                    ? "图生视频"
                    : imageSubMode === "frames"
                      ? "图生 · 首尾帧"
                      : "图生 · 多图参考",
              ],
              ["模型", model.name],
              ...(hideRatioInImageMode ? [["比例", "跟随图片"]] : [["比例", ratio.ratio]]),
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

function SingleUpload({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    onChange(URL.createObjectURL(f))
    e.target.value = ""
  }
  return (
    <div
      onClick={() => inputRef.current?.click()}
      className={cn(
        "relative flex min-h-40 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/40 transition-colors hover:border-primary/50 hover:bg-muted",
        value && "border-solid",
      )}
    >
      {value ? (
        <>
          <Image
            src={value || "/placeholder.svg"}
            alt="参考图片"
            width={400}
            height={400}
            unoptimized
            className="max-h-56 w-auto object-contain"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onChange(null)
            }}
            aria-label="移除图片"
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 text-muted-foreground backdrop-blur transition-colors hover:bg-background hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 py-8 text-sm text-muted-foreground">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background">
            <Upload className="h-5 w-5" />
          </div>
          <span className="font-medium text-foreground/80">点击上传图片</span>
          <span className="text-xs">支持 JPG / PNG / WEBP，最大 10MB，仅支持 1 张</span>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onFile} />
    </div>
  )
}
