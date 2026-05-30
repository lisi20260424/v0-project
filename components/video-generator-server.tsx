import { parseVideoCapabilities } from "@/lib/model-capabilities"
import { getPromptsByType } from "@/lib/get-prompts"
import { getPublicModels, getPublicProviders } from "@/lib/public-catalog"
import { VideoGenerator, type VideoGeneratorModelData } from "./video-generator"

type Props = {
  provider?: string
}

export async function VideoGeneratorServer({ provider }: Props = {}) {
  const [providers, allModels, prompts] = await Promise.all([
    getPublicProviders(),
    getPublicModels("video"),
    getPromptsByType("video"),
  ])

  const enabledProviderNames = new Set(providers.map((p) => p.name))
  const eligibleModels = allModels.filter((m) => enabledProviderNames.has(m.provider))
  const providersWithVideo = providers.filter((p) => eligibleModels.some((m) => m.provider === p.name))
  const activeProviderName =
    (provider && providersWithVideo.find((p) => p.name === provider)?.name) ||
    providersWithVideo[0]?.name ||
    null

  const myModels = activeProviderName ? eligibleModels.filter((m) => m.provider === activeProviderName) : []
  const sortedModels = [...myModels].sort((a, b) => {
    const aDefault = a.config?.is_default_display ? 1 : 0
    const bDefault = b.config?.is_default_display ? 1 : 0
    if (aDefault !== bDefault) return bDefault - aDefault
    return (a.sort_order ?? 0) - (b.sort_order ?? 0)
  })

  const generatorModels: VideoGeneratorModelData[] = sortedModels.map((m) => ({
    id: m.id,
    name: m.name,
    desc: m.description ?? "",
    price: m.cost_per_use ?? 0,
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
