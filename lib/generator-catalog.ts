import { platformAPI } from "@/lib/platform-api"

export type CatalogModel = {
  id: string
  name: string
  provider: string
  cost_per_use?: number
  costPerUse?: number
  description?: string
  config?: Record<string, any> | null
  sort_order?: number
  sortOrder?: number
}

type CatalogProvider = {
  name: string
  display_name?: string
  displayName?: string
}

export async function getGeneratorCatalog(modelType: "video" | "image" | "music", provider?: string) {
  const [providersRes, modelsRes] = await Promise.all([
    platformAPI.publicProviders(),
    platformAPI.publicModels(modelType),
  ])
  const providers = ((providersRes.providers ?? providersRes.data?.providers ?? []) as CatalogProvider[]).filter((p) => p.name)
  const allModels = (modelsRes.models ?? modelsRes.data?.models ?? []) as CatalogModel[]
  const providerNames = new Set(providers.map((p) => p.name))
  const eligibleModels = allModels.filter((m) => providerNames.has(m.provider))
  const providersWithType = providers.filter((p) => eligibleModels.some((m) => m.provider === p.name))
  const activeProviderName =
    (provider && providersWithType.find((p) => p.name === provider)?.name) ||
    providersWithType[0]?.name ||
    null
  const sortedModels = (activeProviderName ? eligibleModels.filter((m) => m.provider === activeProviderName) : []).sort((a, b) => {
    const ad = a.config?.is_default_display ? 1 : 0
    const bd = b.config?.is_default_display ? 1 : 0
    if (ad !== bd) return bd - ad
    return (a.sort_order ?? a.sortOrder ?? 0) - (b.sort_order ?? b.sortOrder ?? 0)
  })
  const activeProvider = providers.find((p) => p.name === activeProviderName)

  return {
    activeProviderName,
    providerDisplayName: activeProvider?.display_name ?? activeProvider?.displayName,
    sortedModels,
  }
}
