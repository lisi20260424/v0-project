"use client"

import * as React from "react"
import Image from "next/image"
import {
  Sparkles,
  Wand2,
  Loader2,
  Crown,
  Download,
  Upload,
  X,
  ImageIcon as ImageLucide,
  Banana,
  Wand2 as FluxIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export type GeneratorModel = {
  id: string
  name: string
  brand?: string
  desc: string
  price: number
  tag?: string
}

export type ImageGeneratorProps = {
  models: GeneratorModel[]
  defaultModelId?: string
}

const STYLES = ["自动", "写实摄影", "电影感", "赛博朋克", "动漫", "水彩", "油画", "3D 渲染", "像素艺术"]

const RATIOS = [
  { id: "11", label: "1:1", w: 1, h: 1 },
  { id: "916", label: "9:16", w: 9, h: 16 },
  { id: "169", label: "16:9", w: 16, h: 9 },
  { id: "34", label: "3:4", w: 3, h: 4 },
  { id: "43", label: "4:3", w: 4, h: 3 },
]

const QUALITIES = [
  { id: "standard", label: "标准" },
  { id: "hd", label: "高清" },
  { id: "ultra", label: "超清 4K", extra: 2 },
]

const EXAMPLES = [
  "一只戴着圆框眼镜的橘色柯基犬坐在书桌前阅读《百年孤独》，皮克斯 3D 动画风格，暖色调灯光",
  "上海外滩的赛博朋克夜景海报，中文标题「未来已来」，霓虹色调，电影海报构图",
  "一朵正在盛开的牡丹花微距特写，花瓣上有细小水珠，柔和自然光，摄影杂志封面",
]

type Props = {
  defaultModelId?: ImageModelId
}

export function ImageGenerator({ defaultModelId = "gpt-image" }: Props) {
  const [modelId, setModelId] = React.useState<ImageModelId>(defaultModelId)
  const [prompt, setPrompt] = React.useState("")
  const [negative, setNegative] = React.useState("")
  const [style, setStyle] = React.useState(STYLES[0])
  const [ratioId, setRatioId] = React.useState("11")
  const [quality, setQuality] = React.useState("hd")
  const [count, setCount] = React.useState(1)
  const [refImage, setRefImage] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [results, setResults] = React.useState<string[]>([])
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const model = MODELS.find((m) => m.id === modelId)!
  const qualityExtra = QUALITIES.find((q) => q.id === quality)?.extra ?? 0
  const regular = (model.price + qualityExtra) * count
  const member = Math.round(regular * 0.75)

  const onGenerate = () => {
    if (!prompt.trim()) return
    setLoading(true)
    setResults([])
    setTimeout(() => {
      setLoading(false)
      const all = [
        "/image-samples/sample-1.jpg",
        "/image-samples/sample-2.jpg",
        "/image-samples/sample-3.jpg",
        "/image-samples/sample-4.jpg",
      ]
      setResults(all.slice(0, count))
    }, 2000)
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setRefImage(URL.createObjectURL(file))
  }

  const ratio = RATIOS.find((r) => r.id === ratioId)!

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1.1fr]">
      {/* Left: form */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
        {/* Models */}
        <div>
          <Label className="mb-2 block text-sm font-medium">
            <span className="mr-1 text-primary">◇</span> 选择模型
          </Label>
          <div className="grid gap-2 sm:grid-cols-3">
            {MODELS.map((m) => {
              const Icon = m.icon
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModelId(m.id)}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-colors",
                    modelId === m.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/40",
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary/20 to-accent/10">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-sm font-medium">{m.name}</span>
                    </div>
                    {m.tag && (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        {m.tag}
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{m.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Reference image (for Nano Banana) */}
        {modelId === "nano-banana" && (
          <div className="mt-5">
            <Label className="mb-2 block text-sm font-medium">
              <span className="mr-1 text-primary">◇</span> 参考图片（可选 · 最多 3 张）
            </Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative flex min-h-24 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/40 p-3 transition-colors hover:border-primary/50",
                refImage && "border-solid",
              )}
            >
              {refImage ? (
                <>
                  <Image
                    src={refImage || "/placeholder.svg"}
                    alt="参考图"
                    width={120}
                    height={120}
                    className="h-24 w-auto object-contain"
                    unoptimized
                  />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute right-2 top-2 h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation()
                      setRefImage(null)
                    }}
                    aria-label="移除图片"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Upload className="h-4 w-4" />
                  点击上传参考图片（PNG / JPG）
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
            <Label htmlFor="img-prompt" className="text-sm font-medium">
              <span className="mr-1 text-primary">◇</span> 提示词
            </Label>
            <span className="text-xs tabular-nums text-muted-foreground">{prompt.length} / 2000</span>
          </div>
          <Textarea
            id="img-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, 2000))}
            placeholder="描述你想要的图像，包括主体、风格、光线、构图、细节等"
            className="min-h-[120px] resize-none bg-background"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((p, i) => (
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

        {/* Negative prompt */}
        <div className="mt-5">
          <Label htmlFor="img-negative" className="mb-2 block text-sm font-medium">
            <span className="mr-1 text-primary">◇</span> 负向提示词（可选）
          </Label>
          <Textarea
            id="img-negative"
            value={negative}
            onChange={(e) => setNegative(e.target.value.slice(0, 500))}
            placeholder="不想出现的元素，例如：模糊、低画质、变形、多余手指"
            className="min-h-[60px] resize-none bg-background"
          />
        </div>

        {/* Style */}
        <div className="mt-5">
          <Label className="mb-2 block text-sm font-medium">
            <span className="mr-1 text-primary">◇</span> 风格
          </Label>
          <div className="flex flex-wrap gap-2">
            {STYLES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStyle(s)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  style === s
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Ratio */}
        <div className="mt-5">
          <Label className="mb-2 block text-sm font-medium">
            <span className="mr-1 text-primary">◇</span> 画面比例
          </Label>
          <div className="flex flex-wrap gap-2">
            {RATIOS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRatioId(r.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                  ratioId === r.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                <span
                  className="inline-block rounded-[2px] border-[1.5px] border-current"
                  style={{ width: r.w * 2 + 4, height: r.h * 2 + 4 }}
                />
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quality + count */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-2 block text-sm font-medium">
              <span className="mr-1 text-primary">◇</span> 画质
            </Label>
            <div className="flex gap-2">
              {QUALITIES.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setQuality(q.id)}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-sm transition-colors",
                    quality === q.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="mb-2 block text-sm font-medium">
              <span className="mr-1 text-primary">◇</span> 数量
            </Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCount(c)}
                  className={cn(
                    "h-10 flex-1 rounded-lg border text-sm transition-colors",
                    count === c
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Price + CTA */}
        <div className="mt-7 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
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
          <Button size="lg" onClick={onGenerate} disabled={loading || !prompt.trim()} className="gap-2 sm:min-w-40">
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

      {/* Right: results */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium">生成结果</h3>
          <span className="text-xs text-muted-foreground">
            {results.length > 0 ? `${results.length} 张图` : "等待生成"}
          </span>
        </div>
        {loading ? (
          <div
            className={cn(
              "grid gap-3",
              count === 1 && "grid-cols-1",
              count === 2 && "grid-cols-2",
              count >= 3 && "grid-cols-2",
            )}
          >
            {Array.from({ length: count }).map((_, i) => (
              <div
                key={i}
                className="flex animate-pulse items-center justify-center rounded-xl border border-border bg-muted"
                style={{ aspectRatio: `${ratio.w}/${ratio.h}` }}
              >
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 p-10 text-center text-sm text-muted-foreground"
            style={{ minHeight: 360 }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <ImageLucide className="h-5 w-5 text-primary" />
            </div>
            <p>输入提示词后点击「立即生成」</p>
            <p className="text-xs">结果会实时展示在此区域</p>
          </div>
        ) : (
          <div
            className={cn(
              "grid gap-3",
              count === 1 && "grid-cols-1",
              count === 2 && "grid-cols-2",
              count >= 3 && "grid-cols-2",
            )}
          >
            {results.map((src, i) => (
              <div key={i} className="group relative overflow-hidden rounded-xl border border-border">
                <Image
                  src={src || "/placeholder.svg"}
                  alt={`结果 ${i + 1}`}
                  width={600}
                  height={600}
                  className="h-auto w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 via-black/30 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="text-[10px] text-white">{model.name}</span>
                  <button
                    type="button"
                    className="pointer-events-auto flex h-7 items-center gap-1 rounded-md bg-white/20 px-2 text-[10px] text-white backdrop-blur hover:bg-white/30"
                  >
                    <Download className="h-3 w-3" />
                    下载
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
