import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()

  // 获取所有启用的模型
  const { data: models, error } = await supabase
    .from("admin_models")
    .select("*")
    .eq("enabled", true)
    .order("sort_order", { ascending: true })

  if (error) {
    return Response.json({ error: error.message }, { status: 400 })
  }

  // 按 model_type 分组，再按 provider 聚合
  const grouped: Record<
    string,
    {
      category: string
      providers: Record<
        string,
        {
          displayName: string
          models: typeof models
        }
      >
    }
  > = {}

  for (const model of models || []) {
    const modelType = model.model_type || "video"
    const provider = model.provider || "Unknown"

    if (!grouped[modelType]) {
      grouped[modelType] = {
        category: modelType,
        providers: {},
      }
    }

    if (!grouped[modelType].providers[provider]) {
      grouped[modelType].providers[provider] = {
        displayName: provider,
        models: [],
      }
    }

    grouped[modelType].providers[provider].models.push(model)
  }

  return Response.json({ grouped })
}
