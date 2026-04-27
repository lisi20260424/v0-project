import { createAdminClient } from "@/lib/supabase/admin"
import {
  type AnyFormat,
  type AnyRequestParams,
  type EndpointConfig,
  type GenerationType,
  type ParsedResponse,
  type PollResult,
  type VideoFormat,
  DEFAULT_ENDPOINTS,
  buildRequestBody,
  parseResponse,
  buildPollUrl,
  parsePollResponse,
} from "@/lib/api-formats"

export type AIGatewayConfig = {
  baseURL: string
  apiKey: string
  modelId: string
  modelType: GenerationType
  endpoint: EndpointConfig
}

/**
 * 调用 AI 网关创建生成请求；自动按 format 构造请求体并解析响应。
 */
export async function callAIGateway(
  config: AIGatewayConfig,
  params: AnyRequestParams,
): Promise<ParsedResponse> {
  const { baseURL, apiKey, modelType, endpoint } = config
  const { body, headers: extraHeaders } = buildRequestBody(modelType, endpoint.format, params)
  const url = `${baseURL.replace(/\/+$/, "")}${endpoint.path.startsWith("/") ? endpoint.path : `/${endpoint.path}`}`

  console.log("[v0] AI Gateway request →", url)
  console.log("[v0] AI Gateway body:", JSON.stringify(body).slice(0, 500))

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(extraHeaders ?? {}),
    },
    body: JSON.stringify(body),
  })

  console.log("[v0] AI Gateway status:", response.status)

  if (!response.ok) {
    let detail = ""
    try {
      const json = await response.clone().json()
      detail = json?.error?.message || json?.message || JSON.stringify(json)
    } catch {
      detail = await response.text()
    }
    throw new Error(`API Gateway Error (${response.status}): ${detail.slice(0, 500)}`)
  }

  return parseResponse(modelType, endpoint.format, response)
}

/**
 * 轮询上游视频任务的最新状态
 */
export async function pollProviderTask(
  baseURL: string,
  apiKey: string,
  format: VideoFormat,
  providerTaskId: string,
  pollPath?: string,
): Promise<PollResult> {
  const url = buildPollUrl(format, baseURL.replace(/\/+$/, ""), providerTaskId, pollPath)
  console.log("[v0] Polling provider task:", url)
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    const text = await response.text()
    return {
      status: "failed",
      error: `轮询失败 (${response.status}): ${text.slice(0, 200)}`,
      raw: { status: response.status, text },
    }
  }

  const json = await response.json().catch(() => ({}))
  return parsePollResponse(format, json)
}

/**
 * 获取模型信息（含供应商配置中的 endpoints）
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
 * 根据模型查找对应供应商，并解析出该类型的端点配置
 */
export async function getEndpointForModel(
  providerName: string,
  modelType: GenerationType,
): Promise<EndpointConfig> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("admin_providers")
    .select("config")
    .eq("name", providerName)
    .single()

  const fallback = DEFAULT_ENDPOINTS[modelType]
  if (error || !data) return fallback

  const cfg = (data.config ?? {}) as { endpoints?: Partial<Record<GenerationType, Partial<EndpointConfig>>> }
  const ep = cfg.endpoints?.[modelType]
  if (!ep) return fallback

  return {
    path: ep.path?.trim() || fallback.path,
    format: (ep.format as AnyFormat) || fallback.format,
    pollPath: ep.pollPath?.trim() || undefined,
  }
}

/**
 * 获取 API 网关配置
 */
export async function getGatewayConfig() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("admin_gateway_settings")
    .select("gateway_url, api_key")
    .eq("id", 1)
    .single()

  if (error || !data) throw new Error("Gateway settings not found")
  if (!data.gateway_url || !data.api_key) throw new Error("Gateway settings incomplete: 请先在系统设置中配置网关 URL 与 API Key")
  return data
}
