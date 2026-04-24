import Image from "next/image"
import Link from "next/link"
import { Copy, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const ITEMS = [
  {
    id: "i1",
    src: "/image-samples/sample-1.jpg",
    title: "霓虹旗袍",
    model: "GPT-Image 2",
    author: "林小野",
    prompt: "上海夜市霓虹灯下的红色旗袍女子，Kodak Portra 400 胶片感，电影光影",
  },
  {
    id: "i2",
    src: "/image-samples/sample-2.jpg",
    title: "晨光咖啡",
    model: "Flux 1.1",
    author: "木子",
    prompt: "陶瓷咖啡杯微距摄影，晨光从侧面洒入，热气袅袅，极简暖色",
  },
  {
    id: "i3",
    src: "/image-samples/sample-3.jpg",
    title: "浮空小屋",
    model: "Nano Banana",
    author: "叁度",
    prompt: "2.5D 等距插画，云端悬浮岛屿上的温馨小屋，瀑布垂落，柔和马卡龙色",
  },
  {
    id: "i4",
    src: "/image-samples/sample-4.jpg",
    title: "凤凰涅槃",
    model: "GPT-Image 2",
    author: "夜枭",
    prompt: "奇幻插画，金红羽翼凤凰自火焰中振翅，暗色背景点缀火星，厚涂数字绘画",
  },
]

export function ImageShowcase() {
  return (
    <section id="images" className="border-b border-border/60 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight md:text-3xl">
              <span className="inline-block h-5 w-1 rounded-full bg-primary" />
              图像精选
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">GPT-Image、Nano Banana、Flux 模型精品。</p>
          </div>
          <Button variant="outline" asChild className="gap-1 bg-transparent text-xs">
            <Link href="/image">
              <Wand2 className="h-3 w-3" />
              立即创作
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map((it) => (
            <article
              key={it.id}
              className="group relative overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className="relative aspect-square overflow-hidden">
                <Image
                  src={it.src || "/placeholder.svg"}
                  alt={it.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <span className="absolute left-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur">
                  {it.model}
                </span>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{it.title}</h3>
                  <span className="text-[10px] text-muted-foreground">@{it.author}</span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{it.prompt}</p>
                <button
                  type="button"
                  className="mt-3 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                >
                  <Copy className="h-3 w-3" />
                  复制提示词
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
