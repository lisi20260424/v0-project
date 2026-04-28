"use client"

import * as React from "react"
import Image from "next/image"
import {
  Sparkles,
  Music2,
  Wand2,
  Loader2,
  Crown,
  Play,
  Pause,
  Download,
  Heart,
  Share2,
  FileText,
  Settings2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { MusicCapabilities } from "@/lib/model-capabilities"
import { useUser } from "@/components/user-provider"
import { useMembership } from "@/components/membership-provider"

type Mode = "inspire" | "custom"

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

const DEFAULT_EXAMPLE_DESC = [
  "一首温暖的中文民谣，木吉他伴奏，女声清澈，讲述夏夜海边的回忆",
  "电子舞曲，BPM 128，合成器 Lead 旋律抓耳，适合夜店氛围",
  "史诗级交响乐配乐，管弦乐编制，适合电影片头，气势磅礴",
]

const SAMPLE_TRACKS = [
  {
    id: "t1",
    title: "夏夜星海",
    cover: "/suno-covers/cover-1.jpg",
    genre: "民谣 · Lo-fi",
    duration: "2:48",
  },
  {
    id: "t2",
    title: "霓虹脉冲",
    cover: "/suno-covers/cover-2.jpg",
    genre: "电子 · House",
    duration: "3:12",
  },
  {
    id: "t3",
    title: "山雾微光",
    cover: "/suno-covers/cover-3.jpg",
    genre: "民谣 · 治愈",
    duration: "3:35",
  },
]

export function MusicGenerator({ models, defaultModelId, prompts = [] }: MusicGeneratorProps) {
  const { user } = useUser()
  const membership = useMembership()
  
  const promptChips: MusicPromptChip[] =
    prompts.length > 0
      ? prompts
      : DEFAULT_EXAMPLE_DESC.map((p, i) => ({ id: `default-${i}`, title: `示例 ${i + 1}`, content: p }))
  if (!models.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
        当前供应商暂未启用任何音乐模型，请先在系统设置中启用对应模型。
      </div>
    )
  }

  const [version, setVersion] = React.useState<string>(defaultModelId ?? models[0].id)
  const model = models.find((x) => x.id === version) ?? models[0]
  const cap = model.capabilities

  const [mode, setMode] = React.useState<Mode>(cap.supportsCustomLyrics ? "inspire" : "inspire")
  const [desc, setDesc] = React.useState("")
  const [title, setTitle] = React.useState("")
  const [lyrics, setLyrics] = React.useState("")
  const [genre, setGenre] = React.useState(cap.genres[0] ?? "流行")
  const [mood, setMood] = React.useState(cap.moods[0] ?? "治愈")
  const [vocal, setVocal] = React.useState(cap.vocals[0]?.id ?? "female")
  const [loading, setLoading] = React.useState(false)
  const [playingId, setPlayingId] = React.useState<string | null>(null)
  const [results, setResults] = React.useState<string[]>([])

  React.useEffect(() => {
    if (!cap.genres.includes(genre)) setGenre(cap.genres[0] ?? "流行")
    if (!cap.moods.includes(mood)) setMood(cap.moods[0] ?? "治愈")
    if (!cap.vocals.find((v) => v.id === vocal)) setVocal(cap.vocals[0]?.id ?? "female")
    if (!cap.supportsCustomLyrics && mode === "custom") setMode("inspire")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.id])

  const regular = model.price * cap.tracksPerGeneration
  const member = Math.round(regular * 0.75)

  const onGenerate = async () => {
    if (mode === "inspire" && !desc.trim()) return
    if (mode === "custom" && !lyrics.trim()) return

    // 检查用户是否登录
    if (!user) {
      toast.error("请先登录或注册账户")
      membership.open("login")
      return
    }

    setLoading(true)
    setResults([])
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "music",
          modelId: model.id,
          prompt: mode === "inspire" ? desc : lyrics,
          params: {
            voice: vocal,
            responseFormat: "mp3",
            speed: 1,
            genre,
            mood,
            title: mode === "custom" ? title : undefined,
          },
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || "生成失败")
      }

      const { task } = await response.json()
      if (task?.status === "failed") throw new Error(task.error_message || "生成失败")
      const urls: string[] = task?.result_urls ?? []
      if (urls.length === 0) throw new Error("未获取到生成的音乐")
      setResults(urls)
    } catch (error) {
      console.error("[v0] Generation error:", error)
      const msg = error instanceof Error ? error.message : "生成失败，请重试"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      {/* Left form */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
        {/* Mode switch */}
        {cap.supportsCustomLyrics && (
          <div className="inline-flex rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => setMode("inspire")}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                mode === "inspire" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Sparkles className="h-4 w-4" />
              灵感模式
            </button>
            <button
              type="button"
              onClick={() => setMode("custom")}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                mode === "custom" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Settings2 className="h-4 w-4" />
              自定义歌词
            </button>
          </div>
        )}

        {/* Version */}
        <div className="mt-5">
          <Label className="mb-2 block text-sm font-medium">
            <span className="mr-1 text-primary">♫</span> 模型版本
          </Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {models.map((x) => (
              <button
                key={x.id}
                type="button"
                onClick={() => setVersion(x.id)}
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors",
                  version === x.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:border-primary/40",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{x.name}</span>
                  {x.tag && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      {x.tag}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{x.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {mode === "inspire" ? (
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <Label htmlFor="desc" className="text-sm font-medium">
                <span className="mr-1 text-primary">♫</span> 歌曲描述
              </Label>
              <span className="text-xs tabular-nums text-muted-foreground">
                {desc.length} / {cap.maxDescLength}
              </span>
            </div>
            <Textarea
              id="desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value.slice(0, cap.maxDescLength))}
              placeholder="描述你想要的歌曲风格、情绪、场景、乐器等，AI 会自动写词并谱曲"
              className="min-h-[120px] resize-none bg-background"
            />
            {promptChips.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {promptChips.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    title={p.content}
                    onClick={() => setDesc(p.content.slice(0, cap.maxDescLength))}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    <Sparkles className="mr-1 inline h-3 w-3 text-primary" />
                    {p.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div>
              <Label htmlFor="title" className="mb-2 block text-sm font-medium">
                <span className="mr-1 text-primary">♫</span> 歌曲标题
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 60))}
                placeholder="为你的作品起个名字"
                className="bg-background"
              />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label htmlFor="lyrics" className="text-sm font-medium">
                  <span className="mr-1 text-primary">♫</span> 歌词
                </Label>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {lyrics.length} / {cap.maxLyricsLength}
                </span>
              </div>
              <Textarea
                id="lyrics"
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value.slice(0, cap.maxLyricsLength))}
                placeholder={
                  "[Verse]\n在第一句歌词...\n\n[Chorus]\n副歌部分...\n\n使用方括号标注段落：Verse / Chorus / Bridge / Outro"
                }
                className="min-h-[180px] resize-none bg-background font-mono text-sm"
              />
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <FileText className="h-3 w-3" />
                AI 自动写词
              </button>
            </div>
          </div>
        )}

        {/* Genre */}
        {cap.genres.length > 0 && (
          <div className="mt-5">
            <Label className="mb-2 block text-sm font-medium">
              <span className="mr-1 text-primary">♫</span> 曲风
            </Label>
            <div className="flex flex-wrap gap-2">
              {cap.genres.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenre(g)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    genre === g
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mood */}
        {cap.moods.length > 0 && (
          <div className="mt-5">
            <Label className="mb-2 block text-sm font-medium">
              <span className="mr-1 text-primary">♫</span> 情绪
            </Label>
            <div className="flex flex-wrap gap-2">
              {cap.moods.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(m)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    mood === m
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Vocal */}
        {cap.vocals.length > 0 && (
          <div className="mt-5">
            <Label className="mb-2 block text-sm font-medium">
              <span className="mr-1 text-primary">♫</span> 人声
            </Label>
            <div className="flex gap-2">
              {cap.vocals.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVocal(v.id)}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-sm transition-colors",
                    vocal === v.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Price + CTA */}
        <div className="mt-7 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm">
              <Crown className="h-3.5 w-3.5 text-accent" />
              <span className="text-muted-foreground">会员价</span>
              <span className="font-semibold tabular-nums">{member} 点</span>
              <span className="text-xs text-muted-foreground">（每次生成 {cap.tracksPerGeneration} 首）</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>普通价</span>
              <span className="tabular-nums line-through">{regular} 点</span>
            </div>
          </div>
          <Button size="lg" onClick={onGenerate} disabled={loading} className="gap-2 sm:min-w-40">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                创作中...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                开始创作
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Right: tracks preview */}
      <div className="flex flex-col gap-4">
        {(loading || results.length > 0) && (
          <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Music2 className="h-4 w-4 text-primary" />
              本次生成
            </h3>
            {loading ? (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                正在创作中，请稍候...
              </div>
            ) : (
              <ul className="space-y-3">
                {results.map((url, i) => (
                  <li
                    key={i}
                    className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">作品 {i + 1}</span>
                      <a
                        href={url}
                        download
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Download className="h-3 w-3" />
                        下载
                      </a>
                    </div>
                    <audio src={url} controls className="w-full" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <Music2 className="h-4 w-4 text-primary" />
              示例作品
            </h3>
            <span className="text-xs text-muted-foreground">共 {SAMPLE_TRACKS.length} 首</span>
          </div>
          <ul className="space-y-3">
            {SAMPLE_TRACKS.map((t) => {
              const isPlaying = playingId === t.id
              return (
                <li
                  key={t.id}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-background p-2 transition-colors hover:border-primary/40"
                >
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                    <Image src={t.cover || "/placeholder.svg"} alt={t.title} fill sizes="64px" className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setPlayingId(isPlaying ? null : t.id)}
                      aria-label={isPlaying ? "暂停" : "播放"}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:bg-black/60 group-hover:opacity-100 data-[playing=true]:opacity-100"
                      data-playing={isPlaying}
                    >
                      {isPlaying ? <Pause className="h-5 w-5 text-white" /> : <Play className="h-5 w-5 text-white" fill="currentColor" />}
                    </button>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{t.title}</p>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{model.name}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t.genre} · {t.duration}
                    </p>
                    {/* fake waveform */}
                    <div className="mt-2 flex items-end gap-0.5 h-5">
                      {Array.from({ length: 42 }).map((_, i) => {
                        const h = ((i * 7) % 100) / 100
                        return (
                          <span
                            key={i}
                            className={cn(
                              "w-[2px] rounded-sm transition-colors",
                              isPlaying && i < 18 ? "bg-primary" : "bg-border",
                            )}
                            style={{ height: `${20 + h * 80}%` }}
                          />
                        )
                      })}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      aria-label="收藏"
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Heart className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="下载"
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="分享"
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-accent/10 p-5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Crown className="h-4 w-4 text-accent" />
            商用授权 · 放心变现
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            会员生成的作品可商用，支持导出 MP3 / WAV 母带、分轨文件与 MIDI，适用于短视频、直播、播客与广告。
          </p>
        </div>
      </div>
    </div>
  )
}
