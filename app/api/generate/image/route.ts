import { streamText } from "ai"
import { resolveModel, getModelInfo } from "@/lib/ai-provider"

export async function POST(req: Request) {
  try {
    const { modelId, prompt, params } = await req.json()

    if (!modelId || !prompt) {
      return new Response(JSON.stringify({ error: "Missing modelId or prompt" }), { status: 400 })
    }

    // 获取模型信息（校验模型是否存在且启用）
    const model = await getModelInfo(modelId)

    // 构建模型配置
    const aiModel = resolveModel({
      provider: model.provider,
      modelId: model.name,
    })

    // 调用 AI SDK 进行流式生成
    const result = await streamText({
      model: aiModel,
      system: `You are a professional image description generator. Generate detailed image generation prompts based on the user's input.`,
      prompt,
      maxTokens: (model.config?.maxTokens as number) ?? 500,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("[v0] Image generation error:", error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Generation failed",
      }),
      { status: 500 },
    )
  }
}
