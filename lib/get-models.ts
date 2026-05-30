import { platformAPI } from "@/lib/platform-api"

export type Model = {
  id: string
  name: string
  provider: string
  desc: string
  price: number
  config: Record<string, unknown>
  modelType: "video" | "image" | "music"
}

export async function getModels(modelType?: "video" | "image" | "music"): Promise<Model[]> {
  try {
    const res = await platformAPI.publicModels(modelType)
    const models = res.models ?? res.data?.models ?? []
    return models.map((m: any) => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      desc: m.description || `${m.provider} 提供的 AI 模型`,
      price: m.cost_per_use ?? m.costPerUse ?? 0,
      config: m.config || {},
      modelType: m.model_type ?? m.modelType,
    }))
  } catch (err) {
    console.error("[v0] Get models error:", err)
    return []
  }
}
