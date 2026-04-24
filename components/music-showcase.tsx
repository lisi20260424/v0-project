"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Play, Pause, Heart, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const TRACKS = [
  { id: "m1", title: "夏夜星海", genre: "民谣 · 治愈", duration: "2:48", cover: "/suno-covers/cover-1.jpg", likes: 1240, author: "清风" },
  { id: "m2", title: "霓虹脉冲", genre: "电子 · House", duration: "3:12", cover: "/suno-covers/cover-2.jpg", likes: 892, author: "Pulse" },
  { id: "m3", title: "山雾微光", genre: "民谣 · 水彩", duration: "3:35", cover: "/suno-covers/cover-3.jpg", likes: 2103, author: "沈予" },
]

export function MusicShowcase() {
  const [playing, setPlaying] = React.useState<string | null>(null)

  return (
    <section id="music" className="border-b border-border/60">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight md:text-3xl">
              <span className="inline-block h-5 w-1 rounded-full bg-primary" />
              热门旋律
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">Suno V5 创作者作品精选。</p>
          </div>
          <Button variant="outline" asChild className="gap-1 bg-transparent text-xs">
            <Link href="/suno">
              <Wand2 className="h-3 w-3" />
              开始创作
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {TRACKS.map((t) => {
            const isPlaying = playing === t.id
            return (
              <div
                key={t.id}
                className="group overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40"
              >
                <div className="relative aspect-square overflow-hidden">
                  <Image src={t.cover || "/placeholder.svg"} alt={t.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <button
                    type="button"
                    onClick={() => setPlaying(isPlaying ? null : t.id)}
                    aria-label={isPlaying ? "暂停" : "播放"}
                    className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 data-[playing=true]:opacity-100"
                    data-playing={isPlaying}
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-black shadow-lg">
                      {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 translate-x-0.5" fill="currentColor" />}
                    </span>
                  </button>

                  {/* Waveform overlay */}
                  <div className="absolute inset-x-4 bottom-4 flex h-8 items-end gap-0.5">
                    {Array.from({ length: 56 }).map((_, i) => {
                      const h = ((i * 11) % 100) / 100
                      return (
                        <span
                          key={i}
                          className={cn(
                            "w-[3px] flex-1 rounded-sm transition-all",
                            isPlaying && i < 22 ? "bg-primary" : "bg-white/60",
                          )}
                          style={{ height: `${20 + h * 80}%` }}
                        />
                      )
                    })}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{t.title}</h3>
                    <span className="text-xs text-muted-foreground">{t.duration}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{t.genre} · @{t.author}</p>
                  <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Heart className="h-3 w-3" />
                      {t.likes.toLocaleString()}
                    </span>
                    <span className="text-primary">复制提示词</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
