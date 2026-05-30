import { parseMusicCapabilities } from "@/lib/model-capabilities"
import { getPromptsByType } from "@/lib/get-prompts"
import { getPublicModels, getPublicProviders } from "@/lib/public-catalog"
import { MusicGenerator, type MusicGeneratorModelData } from "./music-generator"

type Props = {
  provider?: string
}

export async function MusicGeneratorServer({ provider }: Props = {}) {
  const [providers, allModels, prompts] = await Promise.all([
    getPublicProviders(),
    getPublicModels("music"),
    getPromptsByType("music"),
  ])

  const enabledProviderNames = new Set(providers.map((p) => p.name))
  const eligibleModels = allModels.filter((m) => enabledProviderNames.has(m.provider))
  const providersWithMusic = providers.filter((p) => eligibleModels.some((m) => m.provider === p.name))
  const activeProviderName =
    (provider && providersWithMusic.find((p) => p.name === provider)?.name) ||
    providersWithMusic[0]?.name ||
    null

  const myModels = activeProviderName ? eligibleModels.filter((m) => m.provider === activeProviderName) : []
  const sortedModels = [...myModels].sort((a, b) => {
    const aDefault = a.config?.is_default_display ? 1 : 0
    const bDefault = b.config?.is_default_display ? 1 : 0
    if (aDefault !== bDefault) return bDefault - aDefault
    return (a.sort_order ?? 0) - (b.sort_order ?? 0)
  })

  const providerDisplayName = providers.find((p) => p.name === activeProviderName)?.display_name
  const generatorModels: MusicGeneratorModelData[] = sortedModels.map((m) => ({
    id: m.id,
    name: m.name,
    brand: providerDisplayName ?? m.provider,
    desc: m.description ?? "",
    price: m.cost_per_use ?? 0,
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
