import Link from "next/link"
import { ChevronRight, AlertCircle } from "lucide-react"
import { AnnouncementBar } from "@/components/announcement-bar"
import { SiteHeaderServer } from "@/components/site-header-server"
import { SiteFooter } from "@/components/site-footer"
import { getDisplayTools } from "@/lib/display-tools"
import { CATEGORY_LABEL, type ToolCategory } from "@/lib/tools"
import { resolveIcon, defaultIconNameForType, defaultAccentForType } from "@/lib/icon-map"
import { cn } from "@/lib/utils"

type CategoryKey = "video" | "image" | "music"

const CATEGORY_TO_TOOL: Record<CategoryKey, ToolCategory> = {
  video: "video",
  image: "image",
  music: "audio",
}

const CATEGORY_TYPE_LABEL: Record<CategoryKey, string> = {
  video: "视频生成",
  image: "图像生成",
  music: "音乐生成",
}

const CATEGORY_FALLBACK_DESC: Record<CategoryKey, string> = {
  video: "聚合主流视频生成模型，支持文生视频、图生视频、首尾帧 / 多图参考、4K 高清输出。",
  image: "聚合 GPT-Image、Nano Banana、Flux 等顶级图像模型，支持中文渲染、风格化创作、参考图编辑。",
  music: "Suno V5 等主流音乐模型，支持中文歌词、灵感模式 / 自定义歌词、男女合唱、商用授权。",
}

type Props = {
  category: CategoryKey
  /** 当前选中的供应商 name（来自 ?provider=） */
  activeProviderName?: string | null
  children: React.ReactNode
}

/**
 * 统一生成页头壳：根据 category 从数据库读取该类型下的所有 tools 作为切换器。
 */
export async function CategoryPageShell({ category, activeProviderName, children }: Props) {
  const disabledStatus: "suspended" | "banned" | null = null
  const allTools = await getDisplayTools()
  const toolCategory = CATEGORY_TO_TOOL[category]
  const siblings = allTools.filter((t) => t.category === toolCategory)

  // 选中态匹配：tool.id 形如 `${providerName}-${modelType}`
  const activeId = activeProviderName ? `${activeProviderName}-${category}` : null
  const activeTool = (activeId && siblings.find((t) => t.id === activeId)) || siblings[0] || null

  const Icon = resolveIcon(activeTool?.icon ?? defaultIconNameForType(category))
  const accent = activeTool?.accent ?? defaultAccentForType(category)
  const title = activeTool?.name ?? CATEGORY_TYPE_LABEL[category]
  const brand = activeTool?.brand ?? ""
  const desc = activeTool?.desc ?? CATEGORY_FALLBACK_DESC[category]

  // 检查用户是否被禁用
  const isUserDisabled = disabledStatus !== null

  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <SiteHeaderServer />

      {/* 禁用用户提示 */}
      {isUserDisabled && (
        <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <div className="mx-auto flex max-w-7xl items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>
              {disabledStatus === "suspended"
                ? "您的账户已暂停，无法进行生成操作。请联系客服。"
                : "您的账户已被禁用，无法继续使用。"}
            </span>
          </div>
        </div>
      )}

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
            <span className="text-foreground">{CATEGORY_LABEL[toolCategory]}</span>
            {activeTool && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span className="text-foreground">{activeTool.name}</span>
              </>
            )}
          </nav>

          <div className="mt-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-foreground ring-1 ring-border",
                  accent,
                )}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
                  {activeTool?.tag && (
                    <span className="rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary">
                      {activeTool.tag}
                    </span>
                  )}
                </div>
                <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                  {brand && <span className="text-foreground">{brand}</span>}
                  {brand && desc && " · "}
                  {desc}
                </p>
              </div>
            </div>

            {/* Sibling switcher：按供应商列出，点击切换 */}
            {siblings.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {siblings.map((s) => (
                  <Link
                    key={s.id}
                    href={s.href}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs transition-colors",
                      activeTool && s.id === activeTool.id
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            )}
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
