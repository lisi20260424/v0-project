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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { getImageDimension } from "@/lib/ratio-dimensions-mapping"
import type { ImageCapabilities } from "@/lib/model-capabilities"
import { useUser } from "@/components/user-provider"
import { useMembership } from "@/components/membership-provider"
import { platformAPI } from "@/lib/platform-api"

export type ImageGeneratorModelData = {
  id: string
  name: string
  brand?: string
  desc: string
  price: number
  tag?: string
  capabilities: ImageCapabilities
}

export type ImagePromptChip = {
  id: string
  title: string
  content: string
  category?: string | null
}

export type ImageGeneratorProps = {
  models: ImageGeneratorModelData[]
  defaultModelId?: string
  activeProviderName?: string | null
  prompts?: ImagePromptChip[]
}

const DEFAULT_EXAMPLES = [
  "涓€鍙埓鐫€鍦嗘鐪奸暅鐨勬鑹叉煰鍩虹姮鍧愬湪涔︽鍓嶉槄璇汇€婄櫨骞村鐙€嬶紝鐨厠鏂?3D 鍔ㄧ敾椋庢牸锛屾殩鑹茶皟鐏厜",
  "涓婃捣澶栨哗鐨勮禌鍗氭湅鍏嬪鏅捣鎶ワ紝涓枃鏍囬銆屾湭鏉ュ凡鏉ャ€嶏紝闇撹櫣鑹茶皟锛岀數褰辨捣鎶ユ瀯鍥?,
  "涓€鏈垫鍦ㄧ洓寮€鐨勭墶涓硅姳寰窛鐗瑰啓锛岃姳鐡ｄ笂鏈夌粏灏忔按鐝狅紝鏌斿拰鑷劧鍏夛紝鎽勫奖鏉傚織灏侀潰",
]

const QUALITY_EXTRA: Record<string, number> = {
  ultra: 2,
  hd: 0,
  standard: 0,
}

export function ImageGenerator({ models, defaultModelId, prompts = [] }: ImageGeneratorProps) {
  const { user } = useUser()
  const membership = useMembership()
  
  const promptChips: ImagePromptChip[] =
    prompts.length > 0
      ? prompts
      : DEFAULT_EXAMPLES.map((p, i) => ({ id: `default-${i}`, title: `绀轰緥 ${i + 1}`, content: p }))
  if (!models.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
        褰撳墠渚涘簲鍟嗘殏鏈惎鐢ㄤ换浣曞浘鍍忔ā鍨嬶紝璇峰厛鍦ㄧ郴缁熻缃腑鍚敤瀵瑰簲妯″瀷銆?
      </div>
    )
  }

  const [modelId, setModelId] = React.useState<string>(defaultModelId ?? models[0].id)
  const model = models.find((m) => m.id === modelId) ?? models[0]
  const cap = model.capabilities

  const [prompt, setPrompt] = React.useState("")
  const [negative, setNegative] = React.useState("")
  const [style, setStyle] = React.useState(cap.styles[0] ?? "鑷姩")
  const [ratioId, setRatioId] = React.useState(cap.ratios[0]?.id ?? "11")
  const [quality, setQuality] = React.useState(cap.qualities[1]?.id ?? cap.qualities[0]?.id ?? "hd")
  const [count, setCount] = React.useState(cap.counts[0] ?? 1)
  const [refImage, setRefImage] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [results, setResults] = React.useState<string[]>([])
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (!cap.styles.includes(style)) setStyle(cap.styles[0] ?? "鑷姩")
    if (!cap.ratios.find((r) => r.id === ratioId)) setRatioId(cap.ratios[0]?.id ?? "11")
    if (!cap.qualities.find((q) => q.id === quality))
      setQuality(cap.qualities[1]?.id ?? cap.qualities[0]?.id ?? "hd")
    if (!cap.counts.includes(count)) setCount(cap.counts[0] ?? 1)
    if (!cap.supportsReferenceImage) setRefImage(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.id])

  const qualityExtra = QUALITY_EXTRA[quality] ?? 0
  const regular = (model.price + qualityExtra) * count
  const member = Math.round(regular * 0.75)

  const onGenerate = async () => {
    if (!prompt.trim()) return
    
    // 妫€鏌ョ敤鎴锋槸鍚︾櫥褰?
    if (!user) {
      toast.error("璇峰厛鐧诲綍鎴栨敞鍐岃处鎴?)
      membership.open("login")
      return
    }
    
    setLoading(true)
    setResults([])
    try {
      const imageDimension = getImageDimension(ratioId)
      const token = localStorage.getItem("accessToken") ?? ""
      if (!token) throw new Error("请先登录后再试")
      const { data: task } = await platformAPI.createTask(token, {
        type: "image",
        modelId: model.id,
        prompt,
        params: {
          size: imageDimension,
          n: count,
          quality,
          style,
          responseFormat: "url",
          negative: negative || undefined,
        },
      })
      if (task?.status === "failed") {
        throw new Error(task.error_message || "鐢熸垚澶辫触")
      }
      const urls: string[] = task?.result_urls ?? []
      if (urls.length === 0) {
        throw new Error("鏈幏鍙栧埌鐢熸垚鐨勫浘鐗?)
      }
      setResults(urls.slice(0, count))
    } catch (error) {
      console.error("[v0] Generation error:", error)
      const msg = error instanceof Error ? error.message : "鐢熸垚澶辫触锛岃閲嶈瘯"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setRefImage(URL.createObjectURL(file))
  }

  const ratio = cap.ratios.find((r) => r.id === ratioId) ?? cap.ratios[0]

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1.1fr]">
      {/* Left: form */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
        {/* Models */}
        <div>
          <Label className="mb-2 block text-sm font-medium">
            <span className="mr-1 text-primary">鈼?/span> 閫夋嫨妯″瀷
          </Label>
          <div className="grid gap-2 sm:grid-cols-3">
            {models.map((m) => (
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
                  <span className="text-sm font-medium">{m.name}</span>
                  {m.tag && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      {m.tag}
                    </span>
                  )}
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">{m.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Reference image */}
        {cap.supportsReferenceImage && (
          <div className="mt-5">
            <Label className="mb-2 block text-sm font-medium">
              <span className="mr-1 text-primary">鈼?/span> 鍙傝€冨浘鐗囷紙鍙€?路 鏈€澶?{cap.maxReferenceImages} 寮狅級
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
                    alt="鍙傝€冨浘"
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
                    aria-label="绉婚櫎鍥剧墖"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Upload className="h-4 w-4" />
                  鐐瑰嚮涓婁紶鍙傝€冨浘鐗囷紙PNG / JPG锛?
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
              <span className="mr-1 text-primary">鈼?/span> 鎻愮ず璇?
            </Label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {prompt.length} / {cap.maxPromptLength}
            </span>
          </div>
          <Textarea
            id="img-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, cap.maxPromptLength))}
            placeholder="鎻忚堪浣犳兂瑕佺殑鍥惧儚锛屽寘鎷富浣撱€侀鏍笺€佸厜绾裤€侊拷锟斤拷锟斤拷銆佺粏鑺傜瓑"
            className="min-h-[120px] resize-none bg-background"
          />
          {promptChips.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {promptChips.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  title={p.content}
                  onClick={() => setPrompt(p.content.slice(0, cap.maxPromptLength))}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  <Sparkles className="mr-1 inline h-3 w-3 text-primary" />
                  {p.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Negative prompt */}
        {cap.supportsNegativePrompt && (
          <div className="mt-5">
            <Label htmlFor="img-negative" className="mb-2 block text-sm font-medium">
              <span className="mr-1 text-primary">鈼?/span> 璐熷悜鎻愮ず璇嶏紙鍙€夛級
            </Label>
            <Textarea
              id="img-negative"
              value={negative}
              onChange={(e) => setNegative(e.target.value.slice(0, 500))}
              placeholder="涓嶆兂鍑虹幇鐨勫厓绱狅紝渚嬪锛氭ā绯娿€佷綆鐢昏川銆佸彉褰€佸浣欐墜鎸?
              className="min-h-[60px] resize-none bg-background"
            />
          </div>
        )}

        {/* Style */}
        {cap.styles.length > 0 && (
          <div className="mt-5">
            <Label className="mb-2 block text-sm font-medium">
              <span className="mr-1 text-primary">鈼?/span> 椋庢牸
            </Label>
            <div className="flex flex-wrap gap-2">
              {cap.styles.map((s) => (
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
        )}

        {/* Ratio */}
        {cap.ratios.length > 0 && (
          <div className="mt-5">
            <Label className="mb-2 block text-sm font-medium">
              <span className="mr-1 text-primary">鈼?/span> 鐢婚潰姣斾緥
            </Label>
            <div className="flex flex-wrap gap-2">
              {cap.ratios.map((r) => {
                const w = r.w ?? 1
                const h = r.h ?? 1
                return (
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
                      style={{ width: w * 2 + 4, height: h * 2 + 4 }}
                    />
                    {r.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Quality + count */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {cap.qualities.length > 0 && (
            <div>
              <Label className="mb-2 block text-sm font-medium">
                <span className="mr-1 text-primary">鈼?/span> 鐢昏川
              </Label>
              <div className="flex gap-2">
                {cap.qualities.map((q) => (
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
          )}
          {cap.counts.length > 1 && (
            <div>
              <Label className="mb-2 block text-sm font-medium">
                <span className="mr-1 text-primary">鈼?/span> 鏁伴噺
              </Label>
              <div className="flex gap-2">
                {cap.counts.map((c) => (
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
          )}
        </div>

        {/* Price + CTA */}
        <div className="mt-7 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm">
              <Crown className="h-3.5 w-3.5 text-accent" />
              <span className="text-muted-foreground">浼氬憳浠?/span>
              <span className="font-semibold tabular-nums">{member} 鐐?/span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>鏅€氫环</span>
              <span className="tabular-nums line-through">{regular} 鐐?/span>
            </div>
          </div>
          <Button size="lg" onClick={onGenerate} disabled={loading || !prompt.trim()} className="gap-2 sm:min-w-40">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                鐢熸垚涓?..
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                绔嬪嵆鐢熸垚
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Right: results */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium">鐢熸垚缁撴灉</h3>
          <span className="text-xs text-muted-foreground">
            {results.length > 0 ? `${results.length} 寮犲浘` : "绛夊緟鐢熸垚"}
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
                style={{ aspectRatio: `${ratio?.w ?? 1}/${ratio?.h ?? 1}` }}
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
            <p>杈撳叆鎻愮ず璇嶅悗鐐瑰嚮銆岀珛鍗崇敓鎴愩€?/p>
            <p className="text-xs">缁撴灉浼氬疄鏃跺睍绀哄湪姝ゅ尯鍩?/p>
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
                  alt={`缁撴灉 ${i + 1}`}
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
                    涓嬭浇
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

