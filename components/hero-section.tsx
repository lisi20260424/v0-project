import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Wand2, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

const MARQUEE = [
  { src: "/showcase/clay-girl.jpg", label: "Veo 3.1" },
  { src: "/showcase/cyberpunk.jpg", label: "Sora 2" },
  { src: "/showcase/dragon.jpg", label: "可灵 2.0" },
  { src: "/showcase/ocean.jpg", label: "Veo 3.1" },
  { src: "/showcase/anime-girl.jpg", label: "GPT-Image 2" },
  { src: "/showcase/astronaut.jpg", label: "Sora 2 Pro" },
  { src: "/showcase/chef.jpg", label: "可灵 2.0" },
  { src: "/showcase/clay-fox.jpg", label: "Veo 3.1" },
]

export function HeroSection() {
  return (
    <section id="home" className="relative overflow-hidden border-b border-border/60">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-radial-fade" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 text-center md:px-6 md:py-24">
        <Link
          href="/image"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          GPT-Image 2 已上线 · 支持中文文字渲染
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight md:text-6xl">
          <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
            一站式
          </span>
          AI 创作平台
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
          灵境 AI 聚合 Veo、Sora、可灵、GPT-Image、Nano Banana、Suno 等 20+ 全球顶级模型。
          无需翻墙，国内直连，统一点数，一个账号畅享视频、图像、音乐、对话创作。
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" asChild className="gap-2">
            <Link href="#tools">
              <Wand2 className="h-4 w-4" />
              开始创作
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="gap-2 bg-transparent">
            <Link href="/gallery">
              浏览作品广场
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <dl className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "累计生成作品", value: "380万+" },
            { label: "活跃创作者", value: "12.6万" },
            { label: "聚合模型", value: "20+ 款" },
            { label: "平均生成", value: "30 秒" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border/60 bg-card/40 p-4 backdrop-blur">
              <dt className="text-xs text-muted-foreground">{stat.label}</dt>
              <dd className="mt-1 flex items-center justify-center gap-1 text-2xl font-semibold tabular-nums">
                {stat.value}
                <Zap className="h-4 w-4 text-accent" fill="currentColor" aria-hidden="true" />
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Marquee */}
      <div className="relative overflow-hidden border-t border-border/60 py-6">
        <div className="flex animate-marquee gap-4">
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <div
              key={i}
              className="group relative h-40 w-28 flex-shrink-0 overflow-hidden rounded-lg border border-border shadow-sm"
            >
              <Image
                src={m.src || "/placeholder.svg"}
                alt={m.label}
                fill
                sizes="112px"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <span className="absolute bottom-1.5 left-1.5 rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur">
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
