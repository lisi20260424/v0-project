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

  const startTime = Date.now()
  console.log(`[v0:gateway:start] ${modelType} | format=${endpoint.format} | model=${config.modelId}`)
  console.log(`[v0:gateway:request] POST ${url}`)
  console.log(`[v0:gateway:body] ${JSON.stringify(body).slice(0, 800)}`)

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(extraHeaders ?? {}),
    },
    body: JSON.stringify(body),
  })

  const duration = Date.now() - startTime
  console.log(`[v0:gateway:response] status=${response.status} | duration=${duration}ms`)

  if (!response.ok) {
    let detail = ""
    try {
      const json = await response.clone().json()
      detail = json?.error?.message || json?.message || JSON.stringify(json)
    } catch {
      detail = await response.text()
    }
    const error = `API Gateway Error (${response.status}): ${detail.slice(0, 500)}`
    console.error(`[v0:gateway:error] ${error}`)
    throw new Error(error)
  }

  const result = await parseResponse(modelType, endpoint.format, response)
  if (result.kind === "sync") {
    console.log(`[v0:gateway:parsed] kind=sync | urls=${result.urls.length}`)
  } else if (result.kind === "async") {
    console.log(`[v0:gateway:parsed] kind=async | providerTaskId=${result.providerTaskId}`)
  } else {
    console.log(`[v0:gateway:parsed] kind=binary`)
  }
  
  return result
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
  const startTime = Date.now()
  console.log(`[v0:poll:start] format=${format} | taskId=${providerTaskId} | url=${url}`)

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  })

  const duration = Date.now() - startTime
  console.log(`[v0:poll:response] status=${response.status} | duration=${duration}ms`)

  if (!response.ok) {
    const text = await response.text()
    const error = `轮询失败 (${response.status}): ${text.slice(0, 200)}`
    console.warn(`[v0:poll:error] ${error}`)
    return {
      status: "failed",
      error,
      raw: { status: response.status, text },
    }
  }

  const json = await response.json().catch(() => ({}))
  const result = parsePollResponse(format, json)
  
  if (result.status === "running") {
    console.log(`[v0:poll:parsed] status=running | progress=${result.progress ?? "N/A"}`)
  } else if (result.status === "success") {
    console.log(`[v0:poll:parsed] status=success | urls=${result.urls.length}`)
  } else {
    console.log(`[v0:poll:parsed] status=failed | error=${result.error}`)
  }
  
  return result
}

/**
 * 获取模型信息（含供应商配置中的 endpoints）
 */
export async function getModelInfo(modelId: string) {
  console.log(`[v0:model:fetch] modelId=${modelId}`)
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("admin_models")
    .select("id, name, provider, model_type, cost_per_use, config")
    .eq("id", modelId)
    .eq("enabled", true)
    .single()

  if (error) {
    const msg = `Model not found: ${modelId}`
    console.error(`[v0:model:error] ${msg}`)
    throw new Error(msg)
  }
  
  console.log(`[v0:model:found] name=${data.name} | provider=${data.provider} | type=${data.model_type}`)
  return data
}

/**
 * 根据模型查找对应供应商，并解析出该类型的端点配置
 */
export async function getEndpointForModel(
  providerName: string,
  modelType: GenerationType,
): Promise<EndpointConfig> {
  console.log(`[v0:endpoint:fetch] provider=${providerName} | type=${modelType}`)
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("admin_providers")
    .select("config")
    .eq("name", providerName)
    .single()

  const fallback = DEFAULT_ENDPOINTS[modelType]
  if (error || !data) {
    console.warn(`[v0:endpoint:fallback] ${error?.message || "provider config not found"} | using default`)
    return fallback
  }

  const cfg = (data.config ?? {}) as { endpoints?: Partial<Record<GenerationType, Partial<EndpointConfig>>> }
  const ep = cfg.endpoints?.[modelType]
  if (!ep) {
    console.warn(`[v0:endpoint:fallback] no endpoint config for ${modelType}`)
    return fallback
  }

  const result = {
    path: ep.path?.trim() || fallback.path,
    format: (ep.format as AnyFormat) || fallback.format,
    pollPath: ep.pollPath?.trim() || undefined,
    contentPath: (ep as any).contentPath?.trim() || undefined,
  }
  console.log(`[v0:endpoint:resolved] path=${result.path} | format=${result.format} | pollPath=${result.pollPath ? "yes" : "no"} | contentPath=${result.contentPath ? "yes" : "no"}`)
  return result
}

/**
 * 获取 API 网关配置
 */
export async function getGatewayConfig() {
  console.log(`[v0:gateway:config] fetching...`)
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("admin_gateway_settings")
    .select("gateway_url, api_key")
    .eq("id", 1)
    .single()

  if (error || !data) {
    const msg = "Gateway settings not found"
    console.error(`[v0:gateway:config:error] ${msg}`)
    throw new Error(msg)
  }
  if (!data.gateway_url || !data.api_key) {
    const msg = "Gateway settings incomplete: 请先在系统设置中配置网关 URL 与 API Key"
    console.error(`[v0:gateway:config:error] ${msg}`)
    throw new Error(msg)
  }
  console.log(`[v0:gateway:config] url=${data.gateway_url.replace(/\/+$/, "")} | apiKey=${data.api_key.slice(0, 10)}***`)
  return data
}
