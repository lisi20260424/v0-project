import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { AnnouncementBar } from "@/components/announcement-bar"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { TOOLS, CATEGORY_LABEL } from "@/lib/tools"
import { cn } from "@/lib/utils"

type Props = {
  toolId: string
  children: React.ReactNode
}

export function ToolPageShell({ toolId, children }: Props) {
  const tool = TOOLS.find((t) => t.id === toolId)
  if (!tool) return null
  const Icon = tool.icon
  const siblings = TOOLS.filter((t) => t.category === tool.category)

  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <SiteHeader />

      {/* Sub hero */}
      <section className="relative border-b border-border/60 bg-muted/30">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-20 [mask-image:radial-gradient(ellipse_at_top,black_10%,transparent_60%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-muted-foreground" aria-label="面包屑">
            <Link href="/" className="hover:text-foreground">
              首页
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span>{CATEGORY_LABEL[tool.category]}</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">{tool.name}</span>
          </nav>

          <div className="mt-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-foreground ring-1 ring-border",
                  tool.accent,
                )}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{tool.name}</h1>
                  {tool.tag && (
                    <span className="rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary">
                      {tool.tag}
                    </span>
                  )}
                </div>
                <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                  <span className="text-foreground">{tool.brand}</span> · {tool.desc}
                </p>
              </div>
            </div>

            {/* Sibling switcher */}
            <div className="flex flex-wrap gap-2">
              {siblings.map((s) => (
                <Link
                  key={s.id}
                  href={s.href}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs transition-colors",
                    s.id === tool.id
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {s.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">{children}</div>
      </main>

      <SiteFooter />
    </div>
  )
}
