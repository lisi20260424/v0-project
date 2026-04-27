import { callAIGateway, getModelInfo, getGatewayConfig } from "@/lib/ai-provider"

export async function POST(req: Request) {
  try {
    const { 
      modelId, 
      prompt,
      duration,
      width,
      height,
      fps,
      seed,
      n,
    } = await req.json()

    console.log("[v0] Video API request:", { modelId, prompt: prompt.slice(0, 50), duration, width, height, fps })

    if (!modelId || !prompt) {
      return new Response(JSON.stringify({ error: "Missing modelId or prompt" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    const model = await getModelInfo(modelId)
    console.log("[v0] Model info:", model)

    const gateway = await getGatewayConfig()
    console.log("[v0] Gateway URL:", gateway.gateway_url)

    const apiModelId = (model.config?.api_model_id as string) || model.name
    console.log("[v0] API Model ID:", apiModelId)

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

    console.log("[v0] Gateway response status:", response.status)

    const responseText = await response.text()
    console.log("[v0] Gateway response text:", responseText.slice(0, 200))

    if (!response.ok) {
      console.error("[v0] Gateway error:", responseText)
      try {
        const errorData = JSON.parse(responseText)
        return new Response(JSON.stringify({ error: errorData.error?.message || "Generation failed" }), {
          status: response.status,
          headers: { "Content-Type": "application/json" }
        })
      } catch {
        return new Response(JSON.stringify({ error: "Generation failed" }), {
          status: response.status,
          headers: { "Content-Type": "application/json" }
        })
      }
    }

    return new Response(responseText, {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
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
