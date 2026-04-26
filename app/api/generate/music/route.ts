import { streamText } from "ai"
import { resolveModel, getModelInfo } from "@/lib/ai-provider"

export async function POST(req: Request) {
  try {
    const { modelId, description, params } = await req.json()

    if (!modelId || !description) {
      return new Response(JSON.stringify({ error: "Missing modelId or description" }), { status: 400 })
    }

    // 获取模型信息（校验模型是否存在且启用）
    const model = await getModelInfo(modelId)

    // 从 config 中读取实际的 AI SDK 模型 ID，或使用默认值
    const actualModelId = (model.config?.model_id as string) || model.name

    // 构建模型配置
    const aiModel = resolveModel({
      provider: model.provider,
      modelId: actualModelId,
    })

    // 调用 AI SDK 进行流式生成
    const result = await streamText({
      model: aiModel,
      system: `You are a professional music generation assistant. Generate detailed music generation prompts and music theory guidance based on the user's description.`,
      prompt: description,
      maxTokens: (model.config?.maxTokens as number) ?? 500,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("[v0] Music generation error:", error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Generation failed",
      }),
      { status: 500 },
    )
  }
}
