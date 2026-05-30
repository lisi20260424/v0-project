import type { CatalogModelType } from "@/lib/public-catalog"
import { getPublicModels } from "@/lib/public-catalog"

export type Model = {
  id: string
  name: string
  provider: string
  desc: string
  price: number
  config: Record<string, unknown>
  modelType: CatalogModelType
}

export async function getModels(modelType?: CatalogModelType): Promise<Model[]> {
  const models = await getPublicModels(modelType)
  return models.map((m) => ({
    id: m.id,
    name: m.name,
    provider: m.provider,
    desc: m.description || `${m.provider} model`,
    price: m.cost_per_use ?? 0,
    config: m.config || {},
    modelType: m.model_type,
  }))
}
