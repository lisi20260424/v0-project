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

    // 从 config 中读取 API 模型 ID，用于调用网关接口
    const apiModelId = (model.config?.api_model_id as string) || model.name

    // 调用 New API 网关的图像生成接口
    const response = await callAIGateway(
      {
        baseURL: gateway.base_url,
        apiKey: gateway.api_key,
        modelId: apiModelId,
        modelType: "image",
      },
      {
        prompt: prompt.slice(0, 2000),
      }
    )

    return response
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
