import { callAIGateway, getModelInfo, getGatewayConfig } from "@/lib/ai-provider"

export async function POST(req: Request) {
  try {
    const { modelId, description } = await req.json()

    if (!modelId || !description) {
      return new Response(JSON.stringify({ error: "Missing modelId or description" }), { status: 400 })
    }

    // 获取模型信息（校验模型是否存在且启用）
    const model = await getModelInfo(modelId)

    // 获取网关配置（URL + API Key）
    const gateway = await getGatewayConfig()

    // 调用 New API 网关的聊天完成接口
    const response = await callAIGateway(
      {
        baseURL: gateway.base_url,
        apiKey: gateway.api_key,
        modelId: model.name,
      },
      {
        system: "You are a professional music generation engineer. Create detailed music generation prompts with specific genres, moods, instruments, and styles based on user description.",
        prompt: description.slice(0, 2000),
        maxTokens: 1000,
        temperature: 0.7,
        stream: true,
      }
    )

    return response
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
