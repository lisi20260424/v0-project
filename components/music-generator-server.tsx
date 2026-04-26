import { createClient } from "@/lib/supabase/server"
import { parseMusicCapabilities } from "@/lib/model-capabilities"
import { MusicGenerator, type MusicGeneratorModelData } from "./music-generator"

type Props = {
  provider?: string
}

/**
 * Server Component - 读取启用的音乐供应商及其模型并按 provider 过滤。
 */
export async function MusicGeneratorServer({ provider }: Props = {}) {
  const supabase = await createClient()

  const [providersRes, modelsRes] = await Promise.all([
    supabase
      .from("admin_providers")
      .select("name, display_name, sort_order")
      .eq("enabled", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("admin_models")
      .select("id, name, provider, model_type, cost_per_use, description, config, sort_order")
      .eq("enabled", true)
      .eq("model_type", "music")
      .order("sort_order", { ascending: true }),
  ])

  const providers = (providersRes.data ?? []).filter((p) => p.name)
  const allModels = modelsRes.data ?? []
  const enabledProviderNames = new Set(providers.map((p) => p.name as string))
  const eligibleModels = allModels.filter((m) => enabledProviderNames.has(m.provider))

  const providersWithMusic = providers.filter((p) =>
    eligibleModels.some((m) => m.provider === p.name),
  )
  const activeProviderName =
    (provider && providersWithMusic.find((p) => p.name === provider)?.name) ||
    providersWithMusic[0]?.name ||
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
    />
  )
}
