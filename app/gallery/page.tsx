import type { Metadata } from "next"
import { AnnouncementBar } from "@/components/announcement-bar"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { VideoGallery } from "@/components/video-gallery"
import { ImageShowcase } from "@/components/image-showcase"
import { MusicShowcase } from "@/components/music-showcase"

export const metadata: Metadata = {
  title: "作品广场 · 灵境 AI",
  description: "来自全球创作者的精选 AI 作品，视频、图像、音乐三大板块，点击复制提示词一键同款。",
}

export default function GalleryPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <SiteHeader />

      <section className="relative border-b border-border/60 bg-muted/30">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-20 [mask-image:radial-gradient(ellipse_at_top,black_10%,transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 text-center md:px-6 md:py-16">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            每日更新 · 已收录 380 万+ 作品
          </span>
          <h1 className="mt-5 text-balance text-3xl font-semibold tracking-tight md:text-5xl">作品广场</h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm text-muted-foreground md:text-base">
            探索其他创作者的灵感之作，点击任意作品可复制提示词，一键生成属于你的同款。
          </p>
        </div>
      </section>

      <main className="flex-1">
        <VideoGallery />
        <ImageShowcase />
        <MusicShowcase />
      </main>

      <SiteFooter />
    </div>
  )
}
