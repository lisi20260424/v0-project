import { createClient } from "@/lib/supabase/server"
import { openai } from "@ai-sdk/openai"
import { anthropic } from "@ai-sdk/anthropic"
import type { LanguageModel } from "ai"

export type AIProviderConfig = {
  provider: string
  modelId: string
  apiKey?: string
  baseURL?: string
}

/**
 * 根据模型 provider 和配置选择对应的 AI 模型实例
 * 目前支持 openai 和 anthropic；如需扩展，在此追加分支
 */
export function resolveModel(config: AIProviderConfig): LanguageModel {
  const { provider, modelId } = config

  switch (provider.toLowerCase()) {
    case "openai":
      return openai(modelId)
    case "anthropic":
      return anthropic(modelId)
    default:
      throw new Error(`Unsupported AI provider: ${provider}`)
  }
}

/**
 * 获取模型信息（名称、供应商、消耗成本）
 * 用于生成 API 在调用前校验并记录成本
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
 * 获取 API 网关设置（仅服务端可调用）
 * 包含 API 密钥、网关 URL 等敏感配置
 */
export async function getGatewaySettings() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("admin_gateway_settings")
    .select("api_key, gateway_url")
    .eq("id", 1)
    .single()

  if (error) throw new Error("Gateway settings not found")
  return data
}
