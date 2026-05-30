import { parseMusicCapabilities } from "@/lib/model-capabilities"
import { getPromptsByType } from "@/lib/get-prompts"
import { getGeneratorCatalog } from "@/lib/generator-catalog"
import { MusicGenerator, type MusicGeneratorModelData } from "./music-generator"

type Props = {
  provider?: string
}

export async function MusicGeneratorServer({ provider }: Props = {}) {
  const [{ activeProviderName, providerDisplayName, sortedModels }, prompts] = await Promise.all([
    getGeneratorCatalog("music", provider),
    getPromptsByType("music"),
  ])

  const generatorModels: MusicGeneratorModelData[] = sortedModels.map((m) => ({
    id: m.id,
    name: m.name,
    brand: providerDisplayName ?? m.provider,
    desc: m.description ?? "",
    price: m.cost_per_use ?? m.costPerUse ?? 0,
    capabilities: parseMusicCapabilities(m.config),
  }))

  return (
    <MusicGenerator
      models={generatorModels}
      defaultModelId={generatorModels[0]?.id}
      activeProviderName={activeProviderName}
      prompts={prompts}
    />
  )
}
