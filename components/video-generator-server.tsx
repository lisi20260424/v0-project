import { parseVideoCapabilities } from "@/lib/model-capabilities"
import { getPromptsByType } from "@/lib/get-prompts"
import { getGeneratorCatalog } from "@/lib/generator-catalog"
import { VideoGenerator, type VideoGeneratorModelData } from "./video-generator"

type Props = {
  provider?: string
}

export async function VideoGeneratorServer({ provider }: Props = {}) {
  const [{ activeProviderName, sortedModels }, prompts] = await Promise.all([
    getGeneratorCatalog("video", provider),
    getPromptsByType("video"),
  ])

  const generatorModels: VideoGeneratorModelData[] = sortedModels.map((m) => ({
    id: m.id,
    name: m.name,
    desc: m.description ?? "",
    price: m.cost_per_use ?? m.costPerUse ?? 0,
    capabilities: parseVideoCapabilities(m.config),
  }))

  return (
    <VideoGenerator
      models={generatorModels}
      defaultModelId={generatorModels[0]?.id}
      activeProviderName={activeProviderName}
      prompts={prompts}
    />
  )
}
