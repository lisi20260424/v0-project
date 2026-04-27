import { createClient } from "@/lib/supabase/server"
import { parseVideoCapabilities } from "@/lib/model-capabilities"
import { getPromptsByType } from "@/lib/get-prompts"
import { VideoGenerator, type VideoGeneratorModelData } from "./video-generator"

type Props = {
  /** 当前选中的供应商 name（来自 URL searchParams.provider） */
  provider?: string
}

/**
 * Server Component - 从数据库读取启用视频供应商及其模型，并把每个模型的能力解析后传给客户端。
 */
export async function VideoGeneratorServer({ provider }: Props = {}) {
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
      .eq("model_type", "video")
      .order("sort_order", { ascending: true }),
    getPromptsByType("video"),
  ])

  const providers = (providersRes.data ?? []).filter((p) => p.name)
  const allModels = modelsRes.data ?? []

  // 仅保留属于已启用供应商的模型
  const enabledProviderNames = new Set(providers.map((p) => p.name as string))
  const eligibleModels = allModels.filter((m) => enabledProviderNames.has(m.provider))

  // 选定 active provider：优先 URL 参数，回退到第一个有视频模型的供应商
  const providersWithVideo = providers.filter((p) =>
    eligibleModels.some((m) => m.provider === p.name),
  )
  const activeProviderName =
    (provider && providersWithVideo.find((p) => p.name === provider)?.name) ||
    providersWithVideo[0]?.name ||
    null

  // 仅渲染 activeProvider 下的模型
  const myModels = activeProviderName
    ? eligibleModels.filter((m) => m.provider === activeProviderName)
    : []

  // 选默认展示模型：is_default_display 优先，其次 sort_order
  const sortedModels = [...myModels].sort((a, b) => {
    const ad = a.config?.is_default_display ? 1 : 0
    const bd = b.config?.is_default_display ? 1 : 0
    if (ad !== bd) return bd - ad
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
