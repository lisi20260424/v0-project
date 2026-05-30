import type { ReactNode } from "react"
import { getDisplayTools } from "@/lib/display-tools"
import { resolveIcon } from "@/lib/icon-map"

type Props = {
  category: "video" | "image" | "music"
  activeProviderName?: string | null
  children: ReactNode
}

const CATEGORY_LABEL: Record<Props["category"], string> = {
  video: "视频生成",
  image: "图像生成",
  music: "音乐生成",
}

export async function CategoryPageShell({ category, activeProviderName, children }: Props) {
  const categoryKey = category === "music" ? "audio" : category
  const tools = (await getDisplayTools()).filter((tool) => tool.category === categoryKey)

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <section className="mb-8 rounded-3xl border border-border bg-card p-6 md:p-8">
        <p className="text-sm font-medium text-primary">{CATEGORY_LABEL[category]}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">选择模型并开始生成</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          当前页面数据来自 Go 后端公开 catalog 接口。{activeProviderName ? `当前供应商：${activeProviderName}` : "未指定供应商，默认使用第一个可用模型。"}
        </p>
        {tools.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {tools.map((tool) => {
              const Icon = resolveIcon(tool.icon)
              return (
                <a
                  key={tool.id}
                  href={tool.href}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tool.name}
                </a>
              )
            })}
          </div>
        )}
      </section>
      {children}
    </main>
  )
}
