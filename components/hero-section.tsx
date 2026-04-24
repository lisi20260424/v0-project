import Link from "next/link"
import { ArrowRight, Wand2, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section id="home" className="relative overflow-hidden border-b border-border/60">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-radial-fade" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 text-center md:px-6 md:py-28">
        <Link
          href="#features"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
          已升级 Veo 3.1 模型 · 支持 4K 输出
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight md:text-6xl">
          用一句话，
          <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
            生成电影级视频
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
          VeoCraft 基于 Veo 3.1 多模态大模型，提供文生视频、图生视频能力。无需剪辑，无需拍摄，
          只需描述你想要的画面，让创意瞬间成片。
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" asChild className="gap-2">
            <Link href="#generator">
              <Wand2 className="h-4 w-4" />
              立即生成视频
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="gap-2 bg-transparent">
            <Link href="#gallery">
              浏览作品广场
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <dl className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-6 md:grid-cols-4">
          {[
            { label: "累计生成视频", value: "120万+" },
            { label: "创作者", value: "8.6万" },
            { label: "支持模型", value: "12 种" },
            { label: "平均生成", value: "45 秒" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border/60 bg-card/40 p-4 backdrop-blur">
              <dt className="text-xs text-muted-foreground">{stat.label}</dt>
              <dd className="mt-1 flex items-center justify-center gap-1 text-2xl font-semibold">
                {stat.value}
                <Zap className="h-4 w-4 text-accent" aria-hidden="true" />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
