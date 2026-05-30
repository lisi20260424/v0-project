import type { Tool, ToolCategory } from "@/lib/tools"
import { TOOLS } from "@/lib/tools"
import { defaultAccentForType, defaultIconNameForType } from "@/lib/icon-map"

const CLIENT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost/api"

const SERVER_API_BASE_URL =
  process.env.API_INTERNAL_BASE_URL?.replace(/\/$/, "") || CLIENT_API_BASE_URL

const API_BASE_URL = typeof window === "undefined" ? SERVER_API_BASE_URL : CLIENT_API_BASE_URL

export type CatalogModelType = "video" | "image" | "music"

export type CatalogProvider = {
  id: string
  name: string
  display_name: string
  description?: string
  config?: Record<string, any> | null
  enabled?: boolean
  sort_order?: number
}

export type CatalogModel = {
  id: string
  name: string
  provider: string
  model_type: CatalogModelType
  billing_type?: string
  cost_per_use?: number
  description?: string
  config?: Record<string, any> | null
  enabled?: boolean
  sort_order?: number
}

export type CatalogPrompt = {
  id: string
  model_type: CatalogModelType
  title: string
  content: string
  category?: string | null
  enabled?: boolean
  sort_order?: number
}

async function catalogRequest<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store" })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch (error) {
    console.error("[catalog] request failed", path, error)
    return null
  }
}

function bySortOrder<T extends { sort_order?: number }>(a: T, b: T) {
  return (a.sort_order ?? 0) - (b.sort_order ?? 0)
}

export async function getPublicProviders(): Promise<CatalogProvider[]> {
  const data = await catalogRequest<{ providers?: CatalogProvider[] }>("/v1/providers")
  return (data?.providers ?? []).filter((p) => p.name).sort(bySortOrder)
}

export async function getPublicModels(modelType?: CatalogModelType): Promise<CatalogModel[]> {
  const query = modelType ? `?type=${encodeURIComponent(modelType)}` : ""
  const data = await catalogRequest<{ models?: CatalogModel[] }>(`/v1/models${query}`)
  return (data?.models ?? []).filter((m) => m.id && m.name && m.provider).sort(bySortOrder)
}

export async function getPublicPrompts(modelType: CatalogModelType): Promise<CatalogPrompt[]> {
  const data = await catalogRequest<{ prompts?: CatalogPrompt[] }>(`/v1/prompts?type=${encodeURIComponent(modelType)}`)
  return (data?.prompts ?? []).filter((p) => p.id && p.title && p.content).sort(bySortOrder)
}

const TYPE_TO_CATEGORY: Record<CatalogModelType, ToolCategory> = {
  video: "video",
  image: "image",
  music: "audio",
}

export async function getDisplayTools(): Promise<Tool[]> {
  const [providers, models] = await Promise.all([getPublicProviders(), getPublicModels()])
  if (!providers.length || !models.length) return TOOLS

  const providerMap = new Map(providers.map((p) => [p.name, p]))
  const groups = new Map<string, CatalogModel[]>()

  for (const model of models) {
    if (!providerMap.has(model.provider)) continue
    if (!TYPE_TO_CATEGORY[model.model_type]) continue
    const key = `${model.provider}|${model.model_type}`
    groups.set(key, [...(groups.get(key) ?? []), model])
  }

  const tools: Tool[] = []
  for (const [key, list] of groups) {
    const [providerName, modelType] = key.split("|") as [string, CatalogModelType]
    const provider = providerMap.get(providerName)
    if (!provider) continue

    const sorted = [...list].sort((a, b) => {
      const aDefault = a.config?.is_default_display ? 1 : 0
      const bDefault = b.config?.is_default_display ? 1 : 0
      if (aDefault !== bDefault) return bDefault - aDefault
      return bySortOrder(a, b)
    })
    const defaultModel = sorted[0]
    if (!defaultModel) continue

    const ui = provider.config?.ui_by_type?.[modelType] ?? {}
    const displayName = ui.display_name || provider.display_name || provider.name
    const icon = ui.icon || defaultIconNameForType(modelType)
    const accent = ui.accent || defaultAccentForType(modelType)

    tools.push({
      id: `${providerName}-${modelType}`,
      name: displayName,
      brand: defaultModel.name,
      desc: ui.description || defaultModel.description || "",
      href: `/${modelType}?provider=${encodeURIComponent(providerName)}`,
      category: TYPE_TO_CATEGORY[modelType],
      icon,
      accent,
      cost: ui.cost || `${defaultModel.cost_per_use ?? 0} points`,
      tag: ui.tag || undefined,
    })
  }

  return tools.length ? tools : TOOLS
}
