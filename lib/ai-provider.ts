import { createAdminClient } from "@/lib/supabase/admin"

export type AIGatewayConfig = {
  baseURL: string  // API 网关 URL（如 https://api.newapi.ai）
  apiKey: string   // API 密钥
  modelId: string  // 模型 ID（由网关配置决定）
  modelType: "video" | "image" | "music" // 生成类型
}

/**
 * 根据生成类型获取对应的 New API 端点
 */
function getAPIEndpoint(modelType: string): string {
  const endpoints: Record<string, string> = {
    video: "/v1/videos/generations",
    image: "/v1/images/generations",
    music: "/v1/audio/generations",
  }
  return endpoints[modelType] || "/v1/chat/completions"
}

/**
 * 通过 HTTP 调用 New API 网关的对应端点
 * 根据模型类型选择不同的 API 端点（视频/图像/音乐）
 */
export async function callAIGateway(config: AIGatewayConfig, params: {
  prompt: string
  system?: string
  maxTokens?: number
  temperature?: number
  stream?: boolean
}) {
  const { baseURL, apiKey, modelId, modelType } = config
  const { prompt, system = "", maxTokens = 1000, temperature = 0.7, stream = true } = params

  const endpoint = getAPIEndpoint(modelType)
  const url = `${baseURL}${endpoint}`

  // 根据端点类型构建不同的请求体
  let body: Record<string, any>

  if (modelType === "image") {
    // 图像生成接口
    body = {
      model: modelId,
      prompt,
      n: 1,
      size: "1024x1024",
    }
  } else if (modelType === "video") {
    // 视频生成接口
    body = {
      model: modelId,
      prompt,
      duration: 10,
    }
  } else if (modelType === "music") {
    // 音乐生成接口
    body = {
      model: modelId,
      prompt,
      duration: 30,
    }
  } else {
    // 默认使用聊天接口
    const messages = system
      ? [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ]
      : [{ role: "user", content: prompt }]

    body = {
      model: modelId,
      messages,
      max_tokens: maxTokens,
      temperature,
      stream,
    }
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`API Gateway Error: ${error.error?.message || "Unknown error"}`)
  }

  return response
}

/**
 * 获取模型信息（名称、供应商、消耗成本）
 * 使用服务端客户端绕过 RLS
 */
export async function getModelInfo(modelId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("admin_models")
    .select("id, name, provider, model_type, cost_per_use, config")
    .eq("id", modelId)
    .eq("enabled", true)
    .single()

  if (error) throw new Error(`Model not found: ${modelId}`)
  return data
}

/**
 * 获取 API 网关配置（包含 URL、API Key 等）
 * 从 admin_gateway_settings 表读取，字段为 gateway_url 和 api_key
 * 使用服务端客户端绕过 RLS（gateway_settings 被限制不允许读取）
 */
export async function getGatewayConfig() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("admin_gateway_settings")
    .select("gateway_url, api_key")
    .eq("id", 1)
    .single()

  if (error || !data) throw new Error("Gateway settings not found")
  return data
}
