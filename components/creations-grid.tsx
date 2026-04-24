"use client"

import * as React from "react"
import Image from "next/image"
import {
  Play,
  Heart,
  Download,
  Share2,
  MoreVertical,
  Globe2,
  Lock,
  Copy,
  Trash2,
  Video,
  ImageIcon,
  Music2,
  LayoutGrid,
  Rows3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MOCK_CREATIONS, type Creation, type TaskType } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const TYPES: { value: TaskType | "all"; label: string; icon?: typeof Video }[] = [
  { value: "all", label: "全部" },
  { value: "video", label: "视频", icon: Video },
  { value: "image", label: "图像", icon: ImageIcon },
  { value: "audio", label: "音乐", icon: Music2 },
]

export function CreationsGrid() {
  const [type, setType] = React.useState<TaskType | "all">("all")
  const [onlyLiked, setOnlyLiked] = React.useState(false)
  const [view, setView] = React.useState<"grid" | "list">("grid")

  const filtered = MOCK_CREATIONS.filter((c) => {
    if (type !== "all" && c.type !== type) return false
    if (onlyLiked && !c.liked) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">我的创作</h1>
        <p className="text-sm text-muted-foreground">你的所有 AI 创作都会保留 90 天，Pro 会员永久保留。</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={type} onValueChange={(v) => setType(v as TaskType | "all")}>
          <TabsList>
            {TYPES.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="gap-1.5 text-xs">
                {t.icon && <t.icon className="h-3.5 w-3.5" />}
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={onlyLiked ? "default" : "outline"}
            onClick={() => setOnlyLiked((v) => !v)}
            className="h-8 gap-1.5 text-xs"
          >
            <Heart className={cn("h-3.5 w-3.5", onlyLiked && "fill-current")} />
            仅收藏
          </Button>
          <div className="flex rounded-md border border-border bg-card p-0.5">
            <button
              onClick={() => setView("grid")}
              aria-label="网格视图"
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded",
                view === "grid" ? "bg-secondary text-foreground" : "text-muted-foreground",
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setView("list")}
              aria-label="列表视图"
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded",
                view === "list" ? "bg-secondary text-foreground" : "text-muted-foreground",
              )}
            >
              <Rows3 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">还没有创作，去试试生成第一个作品吧</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((item) => (
            <CreationCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <CreationRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

function TypeBadge({ type }: { type: TaskType }) {
  const map = {
    video: { label: "视频", icon: Video, cls: "bg-primary/80 text-primary-foreground" },
    image: { label: "图像", icon: ImageIcon, cls: "bg-violet-500/80 text-white" },
    audio: { label: "音乐", icon: Music2, cls: "bg-cyan-500/80 text-white" },
    chat: { label: "对话", icon: Video, cls: "bg-foreground/80 text-background" },
  }[type]

  return (
    <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium backdrop-blur-sm", map.cls)}>
      <map.icon className="h-2.5 w-2.5" />
      {map.label}
    </span>
  )
}

function CreationCard({ item }: { item: Creation }) {
  return (
    <article className="group relative overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <Image
          src={item.cover || "/placeholder.svg"}
          alt={item.title}
          fill
          sizes="(min-width: 1024px) 220px, (min-width: 640px) 30vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-2 top-2">
          <TypeBadge type={item.type} />
        </div>
        <div className="absolute right-2 top-2 flex gap-1">
          {item.public ? (
            <span className="inline-flex items-center gap-1 rounded bg-background/60 px-1.5 py-0.5 text-[10px] backdrop-blur-sm">
              <Globe2 className="h-2.5 w-2.5" />
              公开
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded bg-background/60 px-1.5 py-0.5 text-[10px] backdrop-blur-sm">
              <Lock className="h-2.5 w-2.5" />
              私有
            </span>
          )}
        </div>
        {item.type === "video" && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/0 transition-colors group-hover:bg-background/20">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-background/80 opacity-0 shadow-lg backdrop-blur-sm transition-opacity group-hover:opacity-100">
              <Play className="h-4 w-4 translate-x-0.5 fill-foreground text-foreground" />
            </div>
          </div>
        )}
        {item.type === "audio" && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-2">
            <div className="flex items-center gap-2">
              <Button size="icon" className="h-7 w-7 rounded-full">
                <Play className="h-3 w-3 translate-x-0.5 fill-current" />
              </Button>
              <div className="flex-1">
                <div className="h-0.5 w-full overflow-hidden rounded-full bg-foreground/20">
                  <div className="h-full w-1/3 bg-primary" />
                </div>
              </div>
              <span className="text-[10px] text-foreground/70 tabular-nums">{item.duration}</span>
            </div>
          </div>
        )}
        {item.duration && item.type === "video" && (
          <div className="absolute bottom-2 right-2 rounded bg-background/70 px-1.5 py-0.5 text-[10px] font-medium backdrop-blur-sm">
            {item.duration}
          </div>
        )}
      </div>

      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-sm font-semibold">{item.title}</h3>
          <button
            aria-label="收藏"
            className={cn(
              "flex-shrink-0 transition-colors",
              item.liked ? "text-rose-500" : "text-muted-foreground hover:text-rose-500",
            )}
          >
            <Heart className={cn("h-4 w-4", item.liked && "fill-current")} />
          </button>
        </div>
        <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{item.prompt}</p>
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-muted-foreground">
            {item.tool} · {item.createdAt}
          </span>
          <div className="flex items-center">
            <Button size="icon" variant="ghost" className="h-6 w-6" aria-label="下载">
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6" aria-label="分享">
              <Share2 className="h-3.5 w-3.5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-6 w-6" aria-label="更多">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Copy className="mr-2 h-3.5 w-3.5" />
                  复制提示词
                </DropdownMenuItem>
                <DropdownMenuItem>
                  {item.public ? (
                    <>
                      <Lock className="mr-2 h-3.5 w-3.5" />
                      设为私有
                    </>
                  ) : (
                    <>
                      <Globe2 className="mr-2 h-3.5 w-3.5" />
                      发布到广场
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  删除作品
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </article>
  )
}

function CreationRow({ item }: { item: Creation }) {
  return (
    <article className="flex items-center gap-4 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40">
      <div className="relative aspect-square h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
        <Image
          src={item.cover || "/placeholder.svg"}
          alt={item.title}
          fill
          sizes="80px"
          className="object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <TypeBadge type={item.type} />
          <h3 className="truncate text-sm font-semibold">{item.title}</h3>
        </div>
        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{item.prompt}</p>
        <div className="mt-1 text-[11px] text-muted-foreground">
          {item.tool} · {item.createdAt}
          {item.duration && <span> · {item.duration}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" className="h-8 gap-1 px-2 text-xs">
          <Download className="h-3.5 w-3.5" />
          下载
        </Button>
        <Button size="sm" variant="ghost" className="h-8 gap-1 px-2 text-xs">
          <Share2 className="h-3.5 w-3.5" />
          分享
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className={cn("h-8 w-8", item.liked ? "text-rose-500" : "text-muted-foreground")}
          aria-label="收藏"
        >
          <Heart className={cn("h-4 w-4", item.liked && "fill-current")} />
        </Button>
      </div>
    </article>
  )
}
