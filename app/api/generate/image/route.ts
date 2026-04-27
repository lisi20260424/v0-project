import { callAIGateway, getModelInfo, getGatewayConfig } from "@/lib/ai-provider"

export async function POST(req: Request) {
  try {
    const {
      modelId,
      prompt,
      size,
      n,
      quality,
      style,
      responseFormat,
      background,
      moderation,
    } = await req.json()

    console.log("[v0] Image API request:", { modelId, prompt: prompt.slice(0, 50), size, n, quality, style })

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
        modelType: "image",
      },
      {
        prompt: prompt.slice(0, 4000),
        imageSize: size,
        imageN: n,
        imageQuality: quality,
        imageStyle: style,
        responseFormat: responseFormat,
        background: background,
        moderation: moderation,
      }
    )

    console.log("[v0] Gateway response status:", response.status)

    // 直接解析 JSON 响应
    const responseData = await response.json()
    console.log("[v0] Gateway response data:", JSON.stringify(responseData).slice(0, 200))

    // 直接返回网关的 JSON 响应
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    console.error("[v0] Image generation error:", error)
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

    // 获取模型信息（校验模型是否存在且启用）
    const model = await getModelInfo(modelId)
    console.log("[v0] Model info:", model)

    // 获取网关配置（URL + API Key）
    const gateway = await getGatewayConfig()
    console.log("[v0] Gateway URL:", gateway.gateway_url)

    // 从 config 中读取 API 模型 ID，用于调用网关接口
    const apiModelId = (model.config?.api_model_id as string) || model.name
    console.log("[v0] API Model ID:", apiModelId)

    // 调用 New API 网关的图像生成接口
    const response = await callAIGateway(
      {
        baseURL: gateway.gateway_url,
        apiKey: gateway.api_key,
        modelId: apiModelId,
        modelType: "image",
      },
      {
        prompt: prompt.slice(0, 4000),
        imageSize: size,
        imageN: n,
        imageQuality: quality,
        imageStyle: style,
        responseFormat: responseFormat,
        background: background,
        moderation: moderation,
      }
    )

    console.log("[v0] Gateway response status:", response.status)

    // 读取网关响应
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

    // 直接返回网关的 JSON 响应给客户端
    return new Response(responseText, {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    console.error("[v0] Image generation error:", error)
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
