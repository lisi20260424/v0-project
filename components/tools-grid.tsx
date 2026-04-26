import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { TOOLS, CATEGORY_LABEL, type ToolCategory, type Tool } from "@/lib/tools"
import { resolveIcon } from "@/lib/icon-map"
import { cn } from "@/lib/utils"

export type ToolsGridProps = {
  models?: Tool[]
}

export function ToolsGrid({ models }: ToolsGridProps) {
  const tools = models || TOOLS
  const categories: ToolCategory[] = ["video", "image", "audio"]

  return (
    <section id="tools" className="border-b border-border/60 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />8 款主流 AI 模型
          </span>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            一个账号，解锁所有顶级 AI 能力
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            统一充值、统一点数、统一计费。无需翻墙，无需多个账号，在国内直接使用全球最前沿的 AI 模型。
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-10">
          {categories.map((cat) => {
            const items = tools.filter((t) => t.category === cat)
            return (
              <div key={cat}>
                <div className="mb-4 flex items-end justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <span className="inline-block h-4 w-1 rounded-full bg-primary" />
                    {CATEGORY_LABEL[cat]}
                    <span className="text-xs font-normal text-muted-foreground">· {items.length} 款</span>
                  </h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((t) => {
                    const Icon = resolveIcon(t.icon)
                    return (
                      <Link
                        key={t.id}
                        href={t.href}
                        className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                      >
                        <div
                          className={cn(
                            "pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br opacity-60 blur-2xl transition-opacity group-hover:opacity-100",
                            t.accent,
                          )}
                        />
                        <div className="relative flex items-start justify-between">
                          <div
                            className={cn(
                              "flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-foreground ring-1 ring-border",
                              t.accent,
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex items-center gap-2">
                            {t.tag && (
                              <span className="rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary">
                                {t.tag}
                              </span>
                            )}
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                          </div>
                        </div>
                        <div className="relative mt-4">
                          <div className="flex items-baseline gap-2">
                            <h4 className="text-base font-semibold">{t.name}</h4>
                            <span className="text-[11px] text-muted-foreground">{t.brand}</span>
                          </div>
                          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{t.desc}</p>
                        </div>
                        <div className="relative mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                          <span className="text-muted-foreground">起步消耗</span>
                          <span className="font-medium text-foreground">{t.cost}</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
