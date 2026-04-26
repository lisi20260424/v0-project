import { callAIGateway, getModelInfo, getGatewayConfig } from "@/lib/ai-provider"

export async function POST(req: Request) {
  try {
    const { modelId, prompt } = await req.json()

    if (!modelId || !prompt) {
      return new Response(JSON.stringify({ error: "Missing modelId or prompt" }), { status: 400 })
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
        system: "You are a professional video generation prompt engineer. Create detailed, cinematic video generation prompts based on user input.",
        prompt: prompt.slice(0, 3000),
        maxTokens: 1500,
        temperature: 0.8,
        stream: true,
      }
    )

    return response
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
