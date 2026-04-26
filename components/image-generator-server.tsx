import { createClient } from "@/lib/supabase/server"
import { parseImageCapabilities } from "@/lib/model-capabilities"
import { getPromptsByType } from "@/lib/get-prompts"
import { ImageGenerator, type ImageGeneratorModelData } from "./image-generator"

type Props = {
  provider?: string
}

/**
 * Server Component - 读取启用的图像供应商和模型，按 provider 过滤后下发给客户端。
 */
export async function ImageGeneratorServer({ provider }: Props = {}) {
  const supabase = await createClient()

  const [providersRes, modelsRes, prompts] = await Promise.all([
    supabase
      .from("admin_providers")
      .select("name, display_name, sort_order")
      .eq("enabled", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("admin_models")
      .select("id, name, provider, model_type, cost_per_use, description, config, sort_order")
      .eq("enabled", true)
      .eq("model_type", "image")
      .order("sort_order", { ascending: true }),
    getPromptsByType("image"),
  ])

  const providers = (providersRes.data ?? []).filter((p) => p.name)
  const allModels = modelsRes.data ?? []
  const enabledProviderNames = new Set(providers.map((p) => p.name as string))
  const eligibleModels = allModels.filter((m) => enabledProviderNames.has(m.provider))

  const providersWithImage = providers.filter((p) =>
    eligibleModels.some((m) => m.provider === p.name),
  )
  const activeProviderName =
    (provider && providersWithImage.find((p) => p.name === provider)?.name) ||
    providersWithImage[0]?.name ||
    null

  const myModels = activeProviderName
    ? eligibleModels.filter((m) => m.provider === activeProviderName)
    : []

  const sortedModels = [...myModels].sort((a, b) => {
    const ad = a.config?.is_default_display ? 1 : 0
    const bd = b.config?.is_default_display ? 1 : 0
    if (ad !== bd) return bd - ad
    return (a.sort_order ?? 0) - (b.sort_order ?? 0)
  })

  const providerDisplayName = providers.find((p) => p.name === activeProviderName)?.display_name as string | undefined

  const generatorModels: ImageGeneratorModelData[] = sortedModels.map((m) => ({
    id: m.id,
    name: m.name,
    brand: providerDisplayName ?? m.provider,
    desc: m.description ?? "",
    price: m.cost_per_use ?? 0,
    capabilities: parseImageCapabilities(m.config),
  }))

  return (
    <ImageGenerator
      models={generatorModels}
      defaultModelId={generatorModels[0]?.id}
      activeProviderName={activeProviderName}
      prompts={prompts}
    />
  )
}
