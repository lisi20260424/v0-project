import { callAIGateway, getModelInfo, getGatewayConfig } from "@/lib/ai-provider"

export async function POST(req: Request) {
  try {
    const { 
      modelId, 
      description,
      voice,
      responseFormat,
      speed,
    } = await req.json()

    console.log("[v0] Music API request:", { modelId, description: description.slice(0, 50), voice, speed })

    if (!modelId || !description) {
      return new Response(JSON.stringify({ error: "Missing modelId or description" }), { 
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
        modelType: "music",
      },
      {
        prompt: description.slice(0, 4096),
        musicVoice: voice,
        musicSpeed: speed,
        responseFormat: responseFormat,
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
    console.error("[v0] Music generation error:", error)
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
