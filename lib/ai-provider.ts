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
import { getPublicModels, getPublicProviders } from "@/lib/public-catalog"

export type AIGatewayConfig = {
  baseURL: string
  apiKey: string
  modelId: string
  modelType: GenerationType
  endpoint: EndpointConfig
}

export async function callAIGateway(config: AIGatewayConfig, params: AnyRequestParams): Promise<ParsedResponse> {
  const { baseURL, apiKey, modelType, endpoint } = config
  const { body, headers: extraHeaders } = buildRequestBody(modelType, endpoint.format, params)
  const url = `${baseURL.replace(/\/+$/, "")}${endpoint.path.startsWith("/") ? endpoint.path : `/${endpoint.path}`}`

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(extraHeaders ?? {}),
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => "")
    throw new Error(`API Gateway Error (${response.status}): ${detail.slice(0, 500)}`)
  }

  return parseResponse(modelType, endpoint.format, response)
}

export async function pollProviderTask(
  baseURL: string,
  apiKey: string,
  format: VideoFormat,
  providerTaskId: string,
  pollPath?: string,
): Promise<PollResult> {
  const url = buildPollUrl(format, baseURL.replace(/\/+$/, ""), providerTaskId, pollPath)
  const response = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  })

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    return { status: "failed", error: `轮询失败 (${response.status}): ${text.slice(0, 200)}`, raw: { status: response.status, text } }
  }

  const json = await response.json().catch(() => ({}))
  return parsePollResponse(format, json)
}

export async function getModelInfo(modelId: string) {
  const models = await getPublicModels()
  const model = models.find((item) => item.id === modelId && item.enabled !== false)
  if (!model) throw new Error(`Model not found: ${modelId}`)
  return {
    id: model.id,
    name: model.name,
    provider: model.provider,
    model_type: model.model_type,
    cost_per_use: model.cost_per_use ?? 0,
    config: model.config ?? {},
  }
}

export async function getEndpointForModel(providerName: string, modelType: GenerationType): Promise<EndpointConfig> {
  const providers = await getPublicProviders()
  const provider = providers.find((item) => item.name === providerName)
  const fallback = DEFAULT_ENDPOINTS[modelType]
  const cfg = (provider?.config ?? {}) as { endpoints?: Partial<Record<GenerationType, Partial<EndpointConfig>>> }
  const ep = cfg.endpoints?.[modelType]
  if (!ep) return fallback
  return {
    path: ep.path?.trim() || fallback.path,
    format: (ep.format as AnyFormat) || fallback.format,
    pollPath: ep.pollPath?.trim() || undefined,
    contentPath: (ep as any).contentPath?.trim() || undefined,
  }
}

export async function getGatewayConfig() {
  const gatewayURL = process.env.AI_GATEWAY_URL
  const apiKey = process.env.AI_GATEWAY_API_KEY
  if (!gatewayURL || !apiKey) {
    throw new Error("Gateway settings incomplete: set AI_GATEWAY_URL and AI_GATEWAY_API_KEY")
  }
  return { gateway_url: gatewayURL, api_key: apiKey }
}

export async function getGenerationTimeouts() {
  return { musicTimeout: 600, imageTimeout: 300, videoTimeout: 1800 }
}
