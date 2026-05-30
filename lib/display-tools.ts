import type { Tool, ToolCategory } from "@/lib/tools"
import { defaultIconNameForType, defaultAccentForType } from "@/lib/icon-map"
import { platformAPI } from "@/lib/platform-api"

type ProviderRow = {
  id: string
  name: string
  display_name?: string
  displayName?: string
  config: Record<string, any> | null
  sort_order?: number
  sortOrder?: number
}

type ModelRow = {
  id: string
  name: string
  provider: string
  model_type?: string
  modelType?: string
  config: Record<string, any> | null
  sort_order?: number
  sortOrder?: number
}

const TYPE_TO_CATEGORY: Record<string, ToolCategory> = {
  video: "video",
  image: "image",
  music: "audio",
}

export async function getDisplayTools(_legacyClient?: unknown): Promise<Tool[]> {
  const [providersRes, modelsRes] = await Promise.all([
    platformAPI.publicProviders(),
    platformAPI.publicModels(),
  ])

  const providers = (providersRes.providers ?? providersRes.data?.providers ?? []) as ProviderRow[]
  const models = (modelsRes.models ?? modelsRes.data?.models ?? []) as ModelRow[]
  const providerMap = new Map(providers.map((p) => [p.name, p]))

  const groups = new Map<string, ModelRow[]>()
  for (const m of models) {
    const modelType = m.model_type ?? m.modelType ?? ""
    if (!providerMap.has(m.provider)) continue
    if (!TYPE_TO_CATEGORY[modelType]) continue
    const key = `${m.provider}|${modelType}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(m)
  }

  const tools: Tool[] = []
  for (const [key, list] of groups) {
    const [providerName, modelType] = key.split("|") as [string, string]
    const provider = providerMap.get(providerName)!
    const sorted = [...list].sort((a, b) => {
      const aDef = a.config?.is_default_display ? 1 : 0
      const bDef = b.config?.is_default_display ? 1 : 0
      if (aDef !== bDef) return bDef - aDef
      return (a.sort_order ?? a.sortOrder ?? 0) - (b.sort_order ?? b.sortOrder ?? 0)
    })
    const defaultModel = sorted[0]
    if (!defaultModel) continue

    const ui: Record<string, any> = provider.config?.ui_by_type?.[modelType] ?? {}
    const displayName = (ui.display_name as string | undefined) || provider.display_name || provider.displayName || provider.name
    const icon = (ui.icon as string | undefined) || defaultIconNameForType(modelType)
    const accent = (ui.accent as string | undefined) || defaultAccentForType(modelType)

    tools.push({
      id: `${providerName}-${modelType}`,
      name: displayName,
      brand: defaultModel.name,
      desc: (ui.description as string | undefined) ?? "",
      href: `/${modelType}?provider=${encodeURIComponent(providerName)}`,
      category: TYPE_TO_CATEGORY[modelType],
      icon,
      accent,
      cost: (ui.cost as string | undefined) ?? "",
      tag: (ui.tag as string | undefined) || undefined,
    })
  }

  return tools
}
