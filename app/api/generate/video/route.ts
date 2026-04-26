import { streamText } from "ai"
import { resolveModel, getModelInfo } from "@/lib/ai-provider"

export async function POST(req: Request) {
  try {
    const { modelId, prompt } = await req.json()

    if (!modelId || !prompt) {
      return new Response(JSON.stringify({ error: "Missing modelId or prompt" }), { status: 400 })
    }

    // 获取模型信息（校验模型是否存在且启用）
    const model = await getModelInfo(modelId)

    // 从 config 中读取实际的 AI SDK 模型 ID，或使用默认值
    const actualModelId = (model.config?.model_id as string) || model.name

    // 构建模型配置并创建 AI 模型实例
    const aiModel = resolveModel({
      provider: model.provider,
      modelId: actualModelId,
      // API Key 会从环境变量自动读取
    })

    // 调用 AI SDK 进行流式生成
    const result = await streamText({
      model: aiModel,
      system: "You are a professional video generation prompt engineer. Create detailed, cinematic video generation prompts based on user input.",
      prompt: prompt.slice(0, 3000), // 限制提示词长度
      maxTokens: 1500,
      temperature: 0.8,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("[v0] Video generation error:", error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Generation failed",
      }),
      { status: 500 },
    )
  }
}
