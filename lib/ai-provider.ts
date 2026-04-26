import { createClient } from "@/lib/supabase/server"

export type AIGatewayConfig = {
  baseURL: string // API 网关 URL（如 https://api.newapi.ai）
  apiKey: string  // API 密钥
  modelId: string // 模型 ID（由网关配置决定）
}

/**
 * 通过 HTTP 调用 New API 网关的聊天完成接口
 * New API 提供 OpenAI 兼容的 /v1/chat/completions 端点
 */
export async function callAIGateway(config: AIGatewayConfig, params: {
  prompt: string
  system?: string
  maxTokens?: number
  temperature?: number
  stream?: boolean
}) {
  const { baseURL, apiKey, modelId } = config
  const { prompt, system = "", maxTokens = 1000, temperature = 0.7, stream = true } = params

  const messages = system
    ? [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ]
    : [{ role: "user", content: prompt }]

  const response = await fetch(`${baseURL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      max_tokens: maxTokens,
      temperature,
      stream,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`API Gateway Error: ${error.error?.message || "Unknown error"}`)
  }

  return response
}

/**
 * 获取模型信息（名称、供应商、消耗成本）
 */
export async function getModelInfo(modelId: string) {
  const supabase = await createClient()
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
 */
export async function getGatewayConfig() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("admin_gateway_settings")
    .select("base_url, api_key, description")
    .eq("enabled", true)
    .single()

  if (error) throw new Error("Gateway settings not found")
  return data
}
