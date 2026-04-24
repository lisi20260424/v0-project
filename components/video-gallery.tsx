"use client"

import * as React from "react"
import Image from "next/image"
import { Download, Play, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Work = {
  id: string
  thumb: string
  model: string
  ratio: "9:16" | "16:9"
  category: "人物" | "风景" | "动画" | "科幻" | "美食"
  createdAt: string
  prompt: string
}

const WORKS: Work[] = [
  {
    id: "w1",
    thumb: "/showcase/clay-girl.jpg",
    model: "veo3.1-fast",
    ratio: "9:16",
    category: "动画",
    createdAt: "2026-01-10 05:49",
    prompt:
      "3D 粘土动画风格，一个扎着橙色发绳的年轻女子卡通角色，圆滚滚的大眼睛，正在攀爬由草莓和芒果堆成的水果山丘。场景光线明媚，色彩浓郁，满是童趣。",
  },
  {
    id: "w2",
    thumb: "/showcase/clay-fox.jpg",
    model: "veo3.1-fast",
    ratio: "9:16",
    category: "动画",
    createdAt: "2026-01-10 05:48",
    prompt:
      "雪夜的粘土动画村庄，矮胖的木屋上堆着蓬松的雪，门口挂着红色灯笼。一只穿着白色厚外套、戴着蓝色针织帽的小狐狸在雪地里踢着雪球。",
  },
  {
    id: "w3",
    thumb: "/showcase/cyberpunk.jpg",
    model: "veo3.1-fast-4K",
    ratio: "9:16",
    category: "科幻",
    createdAt: "2026-01-09 23:12",
    prompt:
      "雨夜的赛博朋克街头，地面反射着霓虹光带。穿黑色机能风外套的少年手握全息平板，指尖在空气中滑动操作，脚步轻快避开水洼。",
  },
  {
    id: "w4",
    thumb: "/showcase/ocean.jpg",
    model: "veo3.1-pro",
    ratio: "9:16",
    category: "风景",
    createdAt: "2026-01-09 20:04",
    prompt: "航拍镜头下的热带海洋，一艘豪华游艇在夕阳金色光辉中破浪前行，远处是绿意盎然的小岛。电影级调色。",
  },
  {
    id: "w5",
    thumb: "/showcase/astronaut.jpg",
    model: "veo3.1-fast-4K",
    ratio: "9:16",
    category: "科幻",
    createdAt: "2026-01-09 18:27",
    prompt: "一位宇航员漂浮在地球上空的深空中，宇航服反射星光，远处是绚丽的星云，史诗级广角镜头。",
  },
  {
    id: "w6",
    thumb: "/showcase/chef.jpg",
    model: "veo3.1-fast",
    ratio: "9:16",
    category: "美食",
    createdAt: "2026-01-09 15:40",
    prompt: "电影级特写，一位大厨在铁锅中翻炒食材，火焰腾空而起，蒸汽弥漫，背景是散景的专业厨房。",
  },
  {
    id: "w7",
    thumb: "/showcase/anime-girl.jpg",
    model: "veo3.1-fast",
    ratio: "9:16",
    category: "人物",
    createdAt: "2026-01-09 12:15",
    prompt: "宫崎骏动画风格，少女站在樱花庭院中，粉色花瓣随风飞舞，柔和阳光洒下，温暖色调。",
  },
  {
    id: "w8",
    thumb: "/showcase/dragon.jpg",
    model: "veo3.1-pro",
    ratio: "9:16",
    category: "科幻",
    createdAt: "2026-01-09 09:48",
    prompt: "一条威严的中国龙穿梭于云雾缭绕的群山之间，鳞片在阳光下闪烁，云层翻腾，奇幻史诗氛围。",
  },
]

const FILTERS = ["全部", "人物", "风景", "动画", "科幻", "美食"] as const

export function VideoGallery() {
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]>("全部")
  const [copiedId, setCopiedId] = React.useState<string | null>(null)

  const works = filter === "全部" ? WORKS : WORKS.filter((w) => w.category === filter)

  const onCopy = async (w: Work) => {
    await navigator.clipboard.writeText(w.prompt)
    setCopiedId(w.id)
    setTimeout(() => setCopiedId(null), 1400)
  }

  return (
    <section id="gallery" className="border-b border-border/60">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">作品广场</h2>
            <p className="mt-2 text-pretty text-muted-foreground">
              来自全球创作者的精选作品，点击可复制提示词、一键生成同款。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm transition-colors",
                  filter === f
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {works.map((w) => (
            <article
              key={w.id}
              className="group relative overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className="relative aspect-[9/16] overflow-hidden">
                <Image
                  src={w.thumb || "/placeholder.svg"}
                  alt={w.prompt.slice(0, 30)}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* play overlay */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-black shadow-lg">
                    <Play className="h-5 w-5 translate-x-0.5" fill="currentColor" />
                  </div>
                </div>

                {/* top tags */}
                <div className="absolute left-2 top-2 flex gap-1">
                  <span className="rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur">
                    {w.model}
                  </span>
                  <span className="rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur">
                    {w.ratio}
                  </span>
                </div>

                {/* bottom prompt */}
                <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                  <p className="line-clamp-2 text-[11px] leading-relaxed">{w.prompt}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-white/70">
                    <span>{w.createdAt}</span>
                    <span>内容由 AI 生成</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2">
                <Button size="sm" variant="secondary" className="flex-1 gap-1 text-xs">
                  <Download className="h-3 w-3" />
                  下载同款
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 bg-transparent text-xs"
                  onClick={() => onCopy(w)}
                  aria-label="复制提示词"
                >
                  {copiedId === w.id ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button variant="outline" size="lg" className="bg-transparent">
            查看更多作品
          </Button>
        </div>
      </div>
    </section>
  )
}
