/**
 * 把 admin_providers + admin_models 转换为前端 AI 工具菜单 / #tools 需要的 Tool 列表。
 *
 * 维度：每个 (供应商 × 模型类型) 组合对应一个 Tool。
 * - UI 配置（图标、渐变、标签、起步消耗、描述、产品名）来自 provider.config.ui_by_type[type]
 * - 所有菜单项统一跳转到 /{modelType}?provider={providerName}，无需单独配置
 * - 默认展示模型：在该 (供应商 × 类型) 下，配置了 config.is_default_display=true 的模型；
 *   若没有则取 sort_order 最小的模型
 * - 卡片大字：ui_by_type[type].display_name 优先，否则回退到 provider.display_name
 * - 卡片小字 brand：默认展示模型的 name
 */
import type { Tool, ToolCategory } from "@/lib/tools"
import { defaultIconNameForType, defaultAccentForType } from "@/lib/icon-map"

type ProviderRow = {
  id: string
  name: string
  display_name: string
  config: Record<string, any> | null
  sort_order: number
}

type ModelRow = {
  id: string
  name: string
  provider: string
  model_type: string
  config: Record<string, any> | null
  sort_order: number
}

const TYPE_TO_CATEGORY: Record<string, ToolCategory> = {
  video: "video",
  image: "image",
  music: "audio",
}

type SupabaseLike = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, value: any) => {
        order: (col: string, opts?: { ascending?: boolean }) => Promise<{
          data: any[] | null
          error: { message: string } | null
        }>
      }
    }
  }
}

export async function getDisplayTools(supabase: SupabaseLike): Promise<Tool[]> {
  const [providersRes, modelsRes] = await Promise.all([
    supabase.from("admin_providers").select("*").eq("enabled", true).order("sort_order", { ascending: true }),
    supabase.from("admin_models").select("*").eq("enabled", true).order("sort_order", { ascending: true }),
  ])

  if (providersRes.error || modelsRes.error) {
    console.error("[v0] 加载供应商/模型失败:", providersRes.error, modelsRes.error)
    return []
  }

  const providers = (providersRes.data ?? []) as ProviderRow[]
  const models = (modelsRes.data ?? []) as ModelRow[]
  const providerMap = new Map(providers.map((p) => [p.name, p]))

  // 按 (provider, model_type) 分组
  const groups = new Map<string, ModelRow[]>()
  for (const m of models) {
    if (!providerMap.has(m.provider)) continue // 供应商被禁用则跳过
    if (!TYPE_TO_CATEGORY[m.model_type]) continue
    const key = `${m.provider}|${m.model_type}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(m)
  }

  const tools: Tool[] = []
  for (const [key, list] of groups) {
    const [providerName, modelType] = key.split("|") as [string, string]
    const provider = providerMap.get(providerName)!

    // 选默认展示模型：is_default_display 优先，其次 sort_order
    const sorted = [...list].sort((a, b) => {
      const aDef = a.config?.is_default_display ? 1 : 0
      const bDef = b.config?.is_default_display ? 1 : 0
      if (aDef !== bDef) return bDef - aDef
      return (a.sort_order ?? 0) - (b.sort_order ?? 0)
    })
    const defaultModel = sorted[0]
    if (!defaultModel) continue

    const ui: Record<string, any> = (provider.config as any)?.ui_by_type?.[modelType] ?? {}
    const displayName = (ui.display_name as string | undefined) || provider.display_name
    const icon = (ui.icon as string | undefined) || defaultIconNameForType(modelType)
    const accent = (ui.accent as string | undefined) || defaultAccentForType(modelType)

    // 统一生成页跳转：/video?provider=xxx、/image?provider=xxx、/music?provider=xxx
    const href = `/${modelType}?provider=${encodeURIComponent(providerName)}`
    tools.push({
      id: `${providerName}-${modelType}`,
      name: displayName,
      brand: defaultModel.name,
      desc: (ui.description as string | undefined) ?? "",
      href,
      category: TYPE_TO_CATEGORY[modelType],
      icon,
      accent,
      cost: (ui.cost as string | undefined) ?? "",
      tag: (ui.tag as string | undefined) || undefined,
    })
  }

  return tools
}
