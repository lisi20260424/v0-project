import { Suspense } from "react"
import { ToolsGrid } from "@/components/tools-grid"
import type { Tool, ToolCategory } from "@/lib/tools"
import { createClient } from "@/lib/supabase/server"
import { defaultIconNameForType, defaultAccentForType } from "@/lib/icon-map"

const MODEL_TYPE_TO_CATEGORY: Record<string, ToolCategory> = {
  video: "video",
  image: "image",
  music: "audio",
}

function modelToTool(model: any): Tool | null {
  const category = MODEL_TYPE_TO_CATEGORY[model.model_type]
  if (!category) return null

  const config = (model.config ?? {}) as Record<string, unknown>
  const uiIcon = (config.ui_icon as string | undefined) || defaultIconNameForType(model.model_type)
  const uiAccent = (config.ui_accent as string | undefined) || defaultAccentForType(model.model_type)
  const uiTag = (config.ui_tag as string | undefined) || undefined
  const uiHref = (config.ui_href as string | undefined) || `/${category}/${model.id}`

  return {
    id: model.id,
    name: model.name,
    brand: model.provider,
    desc: model.description ?? "",
    href: uiHref,
    category,
    icon: uiIcon, // 字符串图标名，由 resolveIcon() 解析
    accent: uiAccent,
    cost: `${model.cost_per_use} 点起`,
    tag: uiTag,
  }
}

async function ToolsGridContent() {
  try {
    const supabase = await createClient()
    const { data: models, error } = await supabase
      .from("admin_models")
      .select("*")
      .eq("enabled", true)
      .order("model_type", { ascending: true })
      .order("sort_order", { ascending: true })

    if (error) {
      console.error("[v0] tools-grid-server 获取模型失败:", error.message)
      return <ToolsGrid />
    }
    if (!models || models.length === 0) {
      return <ToolsGrid />
    }

    const tools = models.map(modelToTool).filter((t): t is Tool => t !== null)
    if (tools.length === 0) return <ToolsGrid />

    return <ToolsGrid models={tools} />
  } catch (err) {
    console.error("[v0] tools-grid-server 异常:", err)
    return <ToolsGrid />
  }
}

export function ToolsGridServer() {
  return (
    <Suspense fallback={<ToolsGrid />}>
      <ToolsGridContent />
    </Suspense>
  )
}
