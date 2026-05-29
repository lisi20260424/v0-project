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
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { getVideoDimensions } from "@/lib/ratio-dimensions-mapping"
import type { VideoCapabilities } from "@/lib/model-capabilities"
import { useUser } from "@/components/user-provider"
import { useMembership } from "@/components/membership-provider"
import { platformAPI } from "@/lib/platform-api"

export type VideoGeneratorModelData = {
  id: string
  name: string
  desc: string
  price: number
  tag?: string
  capabilities: VideoCapabilities
}

export type PromptChip = {
  id: string
  title: string
  content: string
  category?: string | null
}

export type VideoGeneratorProps = {
  models: VideoGeneratorModelData[]
  defaultModelId?: string
  activeProviderName?: string | null
  memberDiscount?: number
  prompts?: PromptChip[]
}

const DEFAULT_EXAMPLES = [
  "澶滄櫄鐨勪笢浜澶达紝闇撹櫣鐏€掓槧鍦ㄦ箍娑︾殑璺潰涓婏紝涓€鍙檸鏂戠尗鎮犻棽鍦拌副姝ワ紝闀滃ご缂撶紦璺熼殢",
  "涓€鏉嬁閾佽缂撶紦鍊掑叆閫忔槑鐜荤拑鏉紝濂舵场褰㈡垚鐖卞績鍥炬锛屽井璺濈壒鍐欙紝鑷劧鍏?,
  "涓浗姘村ⅷ鐢婚鏍硷紝杩滃北浜戞捣缈绘秾锛屼竴鍙舵墎鑸熼『娴佽€屼笅锛岃瘲鎰忔偁杩?,
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
            alt="鍙傝€冨浘鐗囬瑙?
            fill
            className="object-cover"
            unoptimized
          />
          <button
            type="button"
            aria-label="绉婚櫎鍥剧墖"
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

const ACCENT_LABEL = "鈼?

export function VideoGenerator({
  models,
  defaultModelId,
  activeProviderName,
  memberDiscount = 0.75,
  prompts = [],
}: VideoGeneratorProps) {
  const { user } = useUser()
  const membership = useMembership()
  
  // 娌℃湁鍚庡彴閰嶇疆鏃讹紝鍥為€€鍒板唴缃ず渚嬶紝淇濊瘉绌烘暟鎹簱涓嬩篃鑳界粰鐢ㄦ埛鐏垫劅
  const promptChips: PromptChip[] =
    prompts.length > 0
      ? prompts
      : DEFAULT_EXAMPLES.map((p, i) => ({ id: `default-${i}`, title: `绀轰緥 ${i + 1}`, content: p }))
  // 绌虹姸鎬?
  if (!models.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
        褰撳墠渚涘簲鍟嗘殏鏈惎鐢ㄤ换浣曡棰戞ā鍨嬶紝璇峰厛鍦ㄧ郴缁熻缃腑鍚敤瀵瑰簲妯″瀷銆?
      </div>
    )
  }

  const [modelId, setModelId] = React.useState<string>(defaultModelId ?? models[0].id)
  const model = models.find((m) => m.id === modelId) ?? models[0]
  const cap = model.capabilities

  // 褰撴ā鍨嬪垏鎹㈡椂锛屾妸姣斾緥/鏃堕暱/鍙傝€冨浘妯″紡閲嶇疆涓鸿妯″瀷鏀寔鐨勯椤?
  const [ratioId, setRatioId] = React.useState<string>(cap.ratios[0]?.id ?? "169")
  const [durationId, setDurationId] = React.useState<string | undefined>(cap.durations[0]?.id)
  const [count, setCount] = React.useState<number>(cap.counts[0] ?? 1)
  const [mode, setMode] = React.useState<"text" | "image">("text")
  const [imageSubMode, setImageSubMode] = React.useState<"frames" | "multi">("frames")

  React.useEffect(() => {
    // 鍒囨崲妯″瀷鏃舵牎楠屽綋鍓嶉€変腑椤规槸鍚︿粛鍦ㄥ厑璁搁泦涓?
    if (!cap.ratios.find((r) => r.id === ratioId)) setRatioId(cap.ratios[0]?.id ?? "169")
    if (durationId && !cap.durations.find((d) => d.id === durationId)) setDurationId(cap.durations[0]?.id)
    if (!cap.counts.includes(count)) setCount(cap.counts[0] ?? 1)
    if (!cap.supportsImageToVideo && mode === "image") setMode("text")
    if (cap.imageCapability === "single" && imageSubMode !== "frames") setImageSubMode("frames")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.id])

  const [prompt, setPrompt] = React.useState("")
  const [negative, setNegative] = React.useState("")

  // Image mode state
  const [frameStart, setFrameStart] = React.useState<string | null>(null)
  const [frameEnd, setFrameEnd] = React.useState<string | null>(null)
  const [multiImages, setMultiImages] = React.useState<(string | null)[]>(() =>
    Array(cap.multiImageSlots).fill(null),
  )
  const [singleImage, setSingleImage] = React.useState<string | null>(null)

  const [loading, setLoading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [statusMsg, setStatusMsg] = React.useState<string>("")
  const [results, setResults] = React.useState<string[]>([])
  const pollAbortRef = React.useRef<{ cancelled: boolean } | null>(null)

  React.useEffect(() => {
    return () => {
      if (pollAbortRef.current) pollAbortRef.current.cancelled = true
    }
  }, [])

  const ratio = cap.ratios.find((r) => r.id === ratioId) ?? cap.ratios[0]
  const regular = model.price * count
  const member = Math.round(regular * memberDiscount)

  const hasImage =
    cap.imageCapability === "single"
      ? !!singleImage
      : imageSubMode === "frames"
        ? !!frameStart
        : multiImages.some((u) => !!u)

  const hideRatioInImageMode = cap.imageCapability === "single" && mode === "image"

  const onGenerate = async () => {
    if (!prompt.trim()) return
    if (mode === "image" && !hasImage) return

    // 妫€鏌ョ敤鎴锋槸鍚︾櫥褰?
    if (!user) {
      toast.error("璇峰厛鐧诲綍鎴栨敞鍐岃处鎴?)
      membership.open("login")
      return
    }

    if (pollAbortRef.current) pollAbortRef.current.cancelled = true
    const abortToken = { cancelled: false }
    pollAbortRef.current = abortToken

    setLoading(true)
    setProgress(0)
    setStatusMsg("鎻愪氦浠诲姟涓?..")
    setResults([])
    try {
      const { width, height } = getVideoDimensions(ratioId)
      const duration = durationId ? parseInt(durationId) : 5

      const token = localStorage.getItem("accessToken") ?? ""
      if (!token) throw new Error("请先登录后再试")
      const { data: task } = await platformAPI.createTask(token, {
        type: "video",
        modelId: model.id,
        prompt,
        params: {
          duration,
          width,
          height,
          fps: 24,
          n: count,
          ratio: ratio?.ratio,
          negative: negative || undefined,
        },
      })
      if (!task) throw new Error("鏈幏鍙栧埌浠诲姟淇℃伅")

      if (task.status === "success") {
        setResults(task.result_urls ?? [])
        setProgress(100)
        return
      }
      if (task.status === "failed") {
        throw new Error(task.error_message || "鐢熸垚澶辫触")
      }

      // 寮傛浠诲姟锛氬紑濮嬭疆璇?
      setStatusMsg("瑙嗛娓叉煋涓紝璇疯€愬績绛夊緟...")
      setProgress(task.progress ?? 5)
      await pollTask(task.id, abortToken)
    } catch (error) {
      if (!abortToken.cancelled) {
        console.error("[v0] Generation error:", error)
        const msg = error instanceof Error ? error.message : "鐢熸垚澶辫触锛岃閲嶈瘯"
        toast.error(msg)
      }
    } finally {
      if (!abortToken.cancelled) {
        setLoading(false)
        setStatusMsg("")
      }
    }
  }

  async function pollTask(taskId: string, abortToken: { cancelled: boolean }) {
    const startedAt = Date.now()
    while (!abortToken.cancelled) {
      await new Promise((r) => setTimeout(r, 2500))
      if (abortToken.cancelled) return
      let latest: any
      try {
        const token = localStorage.getItem("accessToken") ?? ""
        if (!token) throw new Error("请先登录后再试")
        const polled = await platformAPI.getTask(token, taskId)
        latest = polled.data
      } catch {
        continue
      }
      if (!latest) throw new Error("浠诲姟涓嶅瓨鍦?)

      if (typeof latest.progress === "number") setProgress(latest.progress)

      if (latest.status === "success") {
        setResults(latest.result_urls ?? [])
        setProgress(100)
        return
      }
      if (latest.status === "failed") {
        throw new Error(latest.error_message || "鐢熸垚澶辫触")
      }
      // 瓒呰繃 30 鍒嗛挓鍒欐斁寮?
      if (Date.now() - startedAt > 30 * 60 * 1000) {
        throw new Error("瑙嗛鐢熸垚瓒呮椂锛岃绋嶅悗鏌ョ湅銆屾垜鐨勪换鍔°€?)
      }
    }
  }

  // 鏍规嵁 ratio.w/h 鍔ㄦ€佽绠楀楂樻瘮锛涚珫灞忕敤绐勫搴﹂伩鍏嶅お楂橈紝鏂瑰睆閫備腑锛屾í灞忓崰婊?
  const ratioW = ratio?.w ?? 16
  const ratioH = ratio?.h ?? 9
  const isPortrait = ratioH > ratioW
  const isSquare = ratioW === ratioH
  const previewWidthClass = isPortrait ? "w-48" : isSquare ? "w-56" : "w-full"
  const previewAspectStyle = { aspectRatio: `${ratioW}/${ratioH}` } as React.CSSProperties

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
        {cap.supportsImageToVideo && (
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
              鏂囩敓瑙嗛
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
              鍥剧敓瑙嗛
            </button>
          </div>
        )}

        {/* Image-to-video upload section */}
        {cap.supportsImageToVideo && mode === "image" && (
          <div className="mt-4">
            {cap.imageCapability === "frames" && (
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
                  棣栧熬甯?
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
                  澶氬浘鍙傝€?
                </button>
              </div>
            )}

            {cap.imageCapability === "single" && (
              <div>
                <Label className="mb-1 block text-sm font-medium">
                  <span className="mr-1 text-primary">{ACCENT_LABEL}</span> 鍙傝€冨浘鐗?
                </Label>
                <p className="mb-3 text-xs text-primary/90">涓婁紶鍥剧墖鍚庯紝瑙嗛灏哄灏嗚窡闅忓浘鐗囧昂瀵?/p>
                <SingleUpload value={singleImage} onChange={setSingleImage} />
              </div>
            )}

            {cap.imageCapability === "frames" && imageSubMode === "frames" && (
              <div>
                <Label className="mb-3 block text-sm font-medium">
                  <span className="mr-1 text-primary">{ACCENT_LABEL}</span> 棣栧熬甯?
                </Label>
                <div className="flex items-center gap-2">
                  <UploadSlot label="涓婁紶棣栧抚" value={frameStart} onChange={setFrameStart} className="flex-1" />
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                  <UploadSlot label="涓婁紶灏惧抚" hint="閫夊～" value={frameEnd} onChange={setFrameEnd} className="flex-1" />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">浠呬笂浼犻甯у彲鐢熸垚鑷劧杩囨浮锛涙彁渚涘熬甯у皢寮曞闀滃ご缁堢偣鐢伙拷锟斤拷</p>
              </div>
            )}

            {cap.imageCapability === "frames" && imageSubMode === "multi" && (
              <div>
                <Label className="mb-3 block text-sm font-medium">
                  <span className="mr-1 text-primary">{ACCENT_LABEL}</span> 鍙傝€冨浘
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {multiImages.map((img, i) => (
                    <UploadSlot
                      key={i}
                      label="涓婁紶鍥剧墖"
                      hint={i === 0 ? undefined : "閫夊～"}
                      value={img}
                      onChange={(v) => updateMultiAt(i, v)}
                    />
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">鏈€澶氫笂浼?{cap.multiImageSlots} 寮犲弬鑰冨浘锛岀患鍚堝紩瀵肩敾闈㈤鏍间笌涓讳綋</p>
              </div>
            )}
          </div>
        )}

        {/* Prompt */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <Label htmlFor="prompt" className="text-sm font-medium">
              <span className="mr-1 text-primary">{ACCENT_LABEL}</span>{" "}
              {mode === "image" ? "鎻忚堪鎮ㄧ殑瑙嗛鍦烘櫙" : "鎻愮ず璇?}
            </Label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {prompt.length} / {cap.maxPromptLength}
            </span>
          </div>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, cap.maxPromptLength))}
            placeholder={
              mode === "image"
                ? "缁撳悎鍥剧墖锛屾弿杩颁綘鎯崇敓鎴愮殑鐢婚潰鈥?
                : "鎻忚堪浣犳兂瑕佺殑鐢婚潰锛屼緥濡傦細闀滃ご璇█銆佷富浣撱€侀鏍笺€佸厜绾裤€佸０闊崇瓑銆傝秺璇︾粏锛岀敓鎴愯秺绮惧噯銆?
            }
            className="min-h-[140px] resize-none bg-background"
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
            <Label htmlFor="video-negative" className="mb-2 block text-sm font-medium">
              <span className="mr-1 text-primary">{ACCENT_LABEL}</span> 璐熷悜鎻愮ず璇嶏紙鍙€夛拷锟斤拷
            </Label>
            <Textarea
              id="video-negative"
              value={negative}
              onChange={(e) => setNegative(e.target.value.slice(0, 500))}
              placeholder="涓嶅笇鏈涘嚭鐜扮殑鍏冪礌锛屼緥濡傦細妯＄硦銆佹姈鍔ㄣ€佸彉褰€佷綆鐢昏川"
              className="min-h-[60px] resize-none bg-background"
            />
          </div>
        )}

        {/* Model */}
        <div className="mt-6">
          <Label className="mb-2 block text-sm font-medium">
            <span className="mr-1 text-primary">{ACCENT_LABEL}</span> 妯″瀷鐗堟湰
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

        {/* Ratio (hidden when single-image-to-video since size follows image) */}
        {!hideRatioInImageMode && cap.ratios.length > 0 && (
          <div className="mt-6">
            <Label className="mb-2 block text-sm font-medium">
              <span className="mr-1 text-primary">{ACCENT_LABEL}</span> 瑙嗛姣斾緥
            </Label>
            <div className="flex flex-wrap gap-2">
              {cap.ratios.map((r) => (
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
        {cap.durations.length > 0 && (
          <div className="mt-6">
            <Label className="mb-2 block text-sm font-medium">
              <span className="mr-1 text-primary">{ACCENT_LABEL}</span> 瑙嗛鏃堕暱
            </Label>
            <div className="flex flex-wrap gap-2">
              {cap.durations.map((d) => (
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
        {cap.counts.length > 1 && (
          <div className="mt-6">
            <Label className="mb-2 block text-sm font-medium">
              <span className="mr-1 text-primary">{ACCENT_LABEL}</span> 鐢熸垚鏁伴噺
            </Label>
            <div className="flex flex-wrap gap-2">
              {cap.counts.map((c) => (
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
        )}

        {/* Price + CTA */}
        <div className="mt-8 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
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
          <Button
            size="lg"
            onClick={onGenerate}
            disabled={loading || !prompt.trim() || (mode === "image" && !hasImage)}
            className="gap-2 sm:min-w-40"
          >
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

      {/* Preview */}
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium">瀹炴椂棰勮</h3>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Info className="h-3 w-3" />
              閰嶇疆鎽樿
            </span>
          </div>
          <div
            className={cn(
              "relative mx-auto flex items-center justify-center overflow-hidden rounded-xl border border-border bg-muted",
              previewWidthClass,
            )}
            style={previewAspectStyle}
          >
            {loading ? (
              <div className="flex flex-col items-center gap-3 px-4 text-center text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>{statusMsg || "鎺掗槦鐢熸垚涓?.."}</span>
                <div className="h-1 w-3/4 overflow-hidden rounded-full bg-background">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="tabular-nums text-[11px]">{progress}%</span>
              </div>
            ) : results.length > 0 ? (
              <video
                src={results[0]}
                controls
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 px-4 text-center text-sm text-muted-foreground">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Wand2 className="h-4 w-4 text-primary" />
                </div>
                <span>杈撳叆鎻愮ず璇嶅悗寮€濮嬬敓鎴?/span>
              </div>
            )}
          </div>
          {results.length > 1 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {results.slice(1).map((url, i) => (
                <video key={i} src={url} controls playsInline className="aspect-video w-full rounded-md object-cover" />
              ))}
            </div>
          )}

          <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
            {[
              [
                "妯″紡",
                mode === "text"
                  ? "鏂囩敓瑙嗛"
                  : cap.imageCapability === "single"
                    ? "鍥剧敓瑙嗛"
                    : imageSubMode === "frames"
                      ? "鍥剧敓 路 棣栧熬甯?
                      : "鍥剧敓 路 澶氬浘鍙傝€?,
              ],
              ["妯″瀷", model.name],
              ...(hideRatioInImageMode ? [["姣斾緥", "璺熼殢鍥剧墖"]] : [["姣斾緥", ratio.ratio]]),
              ...(durationId ? [["鏃堕暱", cap.durations.find((d) => d.id === durationId)?.label ?? "-"]] : []),
              ["鏁伴噺", `${count} 鏉],
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
            鍗囩骇浼氬憳 路 7.5 鎶樼渷鏇村
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            浼氬憳鍙韩鎵€鏈夋ā鍨?75 鎶樸€佹瘡鏃ョ鍒伴鐐规暟銆佺敓鎴愰槦鍒椾紭鍏堛€佹敮鎸佺鏈夋ā鍨嬪畾鍒躲€?
          </p>
          <Button size="sm" variant="outline" className="mt-4 gap-1 bg-background/60">
            鏌ョ湅浼氬憳鐗规潈
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
            alt="鍙傝€冨浘鐗?
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
            aria-label="绉婚櫎鍥剧墖"
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
          <span className="font-medium text-foreground/80">鐐瑰嚮涓婁紶鍥剧墖</span>
          <span className="text-xs">鏀寔 JPG / PNG / WEBP锛屾渶澶?10MB锛屼粎鏀寔 1 寮?/span>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onFile} />
    </div>
  )
}


