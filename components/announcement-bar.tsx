"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, Megaphone, X } from "lucide-react"

const ANNOUNCEMENTS = [
  { label: "GPT-Image 2 已上线", href: "/image" },
  { label: "Sora 2 Pro 限时 7 折", href: "/sora" },
  { label: "可灵 2.0 中文理解大幅升级", href: "/kling" },
  { label: "Suno V5 支持 4 分钟长曲", href: "/suno" },
]

export function AnnouncementBar() {
  const [index, setIndex] = React.useState(0)
  const [dismissed, setDismissed] = React.useState(false)

  React.useEffect(() => {
    const timer = setInterval(() => setIndex((current) => (current + 1) % ANNOUNCEMENTS.length), 3500)
    return () => clearInterval(timer)
  }, [])

  if (dismissed) return null
  const item = ANNOUNCEMENTS[index]

  return (
    <div className="relative border-b border-border/60 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-center gap-3 px-4 text-xs md:px-6">
        <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
          <Megaphone className="h-3.5 w-3.5 text-primary" />
          公告
        </span>
        <Link href={item.href} className="group inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground">
          <span key={index} className="animate-in fade-in slide-in-from-bottom-1 duration-500">{item.label}</span>
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="关闭公告"
          className="absolute right-2 text-muted-foreground transition-colors hover:text-foreground md:right-4"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
