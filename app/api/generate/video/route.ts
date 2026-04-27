import { callAIGateway, getModelInfo, getGatewayConfig } from "@/lib/ai-provider"

export async function POST(req: Request) {
  try {
    const { 
      modelId, 
      prompt,
      // 新增参数
      duration,
      width,
      height,
      fps,
      seed,
      n,
    } = await req.json()

    if (!modelId || !prompt) {
      return new Response(JSON.stringify({ error: "Missing modelId or prompt" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    // 获取模型信息（校验模型是否存在且启用）
    const model = await getModelInfo(modelId)
    console.log("[v0] Model info:", model)

    // 获取网关配置（URL + API Key）
    const gateway = await getGatewayConfig()
    console.log("[v0] Gateway URL:", gateway.gateway_url)

    // 从 config 中读取 API 模型 ID，用于调用网关接口
    const apiModelId = (model.config?.api_model_id as string) || model.name
    console.log("[v0] API Model ID:", apiModelId)

    // 调用 New API 网关的视频生成接口
    // 参考文档: https://docs.newapi.pro/zh/docs/api/ai-model/videos/createvideogeneration
    const response = await callAIGateway(
      {
        baseURL: gateway.gateway_url,
        apiKey: gateway.api_key,
        modelId: apiModelId,
        modelType: "video",
      },
      {
        prompt: prompt.slice(0, 3000),
        videoDuration: duration,
        videoWidth: width,
        videoHeight: height,
        videoFps: fps,
        videoSeed: seed,
        videoN: n,
      }
    )

    return response
  } catch (error) {
    console.error("[v0] Video generation error:", error)
    const errorMessage = error instanceof Error ? error.message : "Generation failed"
    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      },
    )
  }
}
