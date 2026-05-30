import { parseImageCapabilities } from "@/lib/model-capabilities"
import { getPromptsByType } from "@/lib/get-prompts"
import { getGeneratorCatalog } from "@/lib/generator-catalog"
import { ImageGenerator, type ImageGeneratorModelData } from "./image-generator"

type Props = {
  provider?: string
}

export async function ImageGeneratorServer({ provider }: Props = {}) {
  const [{ activeProviderName, providerDisplayName, sortedModels }, prompts] = await Promise.all([
    getGeneratorCatalog("image", provider),
    getPromptsByType("image"),
  ])

  const generatorModels: ImageGeneratorModelData[] = sortedModels.map((m) => ({
    id: m.id,
    name: m.name,
    brand: providerDisplayName ?? m.provider,
    desc: m.description ?? "",
    price: m.cost_per_use ?? m.costPerUse ?? 0,
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
