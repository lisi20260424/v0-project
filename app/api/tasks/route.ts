import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  callAIGateway,
  getEndpointForModel,
  getGatewayConfig,
  getModelInfo,
} from "@/lib/ai-provider"
import type { GenerationType, AnyRequestParams } from "@/lib/api-formats"

export const dynamic = "force-dynamic"

/**
 * GET /api/tasks - 列出当前用户的任务（按创建时间倒序）
 *  - ?type=image|video|music 过滤类型
 *  - ?status=running|success|failed 过滤状态
 *  - ?limit=50 默认 50，最大 100
 */
export async function GET(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "未登录" }, { status: 401 })

  const url = new URL(req.url)
  const type = url.searchParams.get("type")
  const status = url.searchParams.get("status")
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100)

  let query = supabase
    .from("generation_tasks")
    .select(
      "id, type, model_name, provider_name, tool_label, prompt, params, status, progress, result_urls, cost, error_message, created_at, completed_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit)

  if (type && ["image", "video", "music"].includes(type)) query = query.eq("type", type)
  if (status && ["queued", "running", "success", "failed"].includes(status)) {
    query = query.eq("status", status)
  }

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ tasks: data ?? [] })
}

/**
 * POST /api/tasks - 创建生成任务
 * Body:
 * {
 *   type: "image"|"video"|"music",
 *   modelId: string,
 *   prompt: string,
 *   params?: { ...生成参数 }
 * }
 *
 * 行为：
 *   - image / music：同步调用网关，把结果 URL 写入任务，立即返回
 *   - video：调用网关创建上游异步任务，记录 provider_task_id 后立即返回；前端轮询 GET /api/tasks/[id]
 */
export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "未登录" }, { status: 401 })

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return Response.json({ error: "请求体格式错误" }, { status: 400 })
  }

  const { type, modelId, prompt, params } = payload as {
    type: GenerationType
    modelId: string
    prompt: string
    params?: Record<string, any>
  }

  if (!type || !["image", "video", "music"].includes(type)) {
    return Response.json({ error: "缺少或无效的 type" }, { status: 400 })
  }
  if (!modelId) return Response.json({ error: "缺少 modelId" }, { status: 400 })
  if (!prompt || !prompt.trim()) return Response.json({ error: "缺少 prompt" }, { status: 400 })

  const admin = createAdminClient()

  // 1. 取模型与供应商配置
  let model
  try {
    model = await getModelInfo(modelId)
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "模型不可用" }, { status: 400 })
  }

  if (model.model_type !== type) {
    return Response.json({ error: `模型类型不匹配：模型为 ${model.model_type}，请求为 ${type}` }, { status: 400 })
  }

  const endpoint = await getEndpointForModel(model.provider, type)

  // 2. 创建任务记录（先 running，便于追踪）
  const { data: task, error: insertError } = await admin
    .from("generation_tasks")
    .insert({
      user_id: user.id,
      type,
      model_id: model.id,
      model_name: model.name,
      provider_name: model.provider,
      tool_label: `${model.name} · ${typeLabel(type)}`,
      prompt: prompt.slice(0, 4000),
      params: params ?? {},
      status: "running",
      progress: 0,
      cost: model.cost_per_use ?? 0,
    })
    .select()
    .single()

  if (insertError || !task) {
    return Response.json({ error: insertError?.message || "创建任务失败" }, { status: 500 })
  }

  // 3. 网关配置
  let gateway
  try {
    gateway = await getGatewayConfig()
  } catch (e) {
    await admin
      .from("generation_tasks")
      .update({
        status: "failed",
        error_message: e instanceof Error ? e.message : "网关未配置",
        completed_at: new Date().toISOString(),
      })
      .eq("id", task.id)
    return Response.json({ error: e instanceof Error ? e.message : "网关未配置" }, { status: 500 })
  }

  const apiModelId = (model.config as any)?.api_model_id || model.name

  // 4. 调用网关
  const requestParams: AnyRequestParams = buildRequestParams(type, prompt, modelId, apiModelId, params ?? {})

  try {
    const parsed = await callAIGateway(
      {
        baseURL: gateway.gateway_url,
        apiKey: gateway.api_key,
        modelId: apiModelId,
        modelType: type,
        endpoint,
      },
      requestParams,
    )

    if (parsed.kind === "sync") {
      const { data: updated } = await admin
        .from("generation_tasks")
        .update({
          status: "success",
          progress: 100,
          result_urls: parsed.urls,
          provider_raw: parsed.raw as any,
          completed_at: new Date().toISOString(),
        })
        .eq("id", task.id)
        .select()
        .single()
      return Response.json({ task: updated ?? { ...task, status: "success", result_urls: parsed.urls } })
    }

    if (parsed.kind === "async") {
      const { data: updated } = await admin
        .from("generation_tasks")
        .update({
          status: "running",
          progress: 5,
          provider_task_id: parsed.providerTaskId,
          provider_raw: parsed.raw as any,
        })
        .eq("id", task.id)
        .select()
        .single()
      return Response.json({ task: updated ?? task })
    }

    // binary 暂不支持
    await admin
      .from("generation_tasks")
      .update({
        status: "failed",
        error_message: "上游返回二进制响应，当前不支持直接保存为 URL",
        completed_at: new Date().toISOString(),
      })
      .eq("id", task.id)
    return Response.json({ error: "上游返回二进制响应，当前不支持" }, { status: 502 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "生成失败"
    console.error("[v0] Task generation failed:", err)
    await admin
      .from("generation_tasks")
      .update({
        status: "failed",
        error_message: message,
        completed_at: new Date().toISOString(),
      })
      .eq("id", task.id)
    return Response.json({ error: message }, { status: 500 })
  }
}

/* ---------------- helpers ---------------- */

function typeLabel(t: GenerationType): string {
  if (t === "video") return "视频"
  if (t === "image") return "图像"
  return "音乐"
}

function buildRequestParams(
  type: GenerationType,
  prompt: string,
  _internalId: string,
  apiModelId: string,
  p: Record<string, any>,
): AnyRequestParams {
  if (type === "image") {
    return {
      prompt: prompt.slice(0, 4000),
      modelId: apiModelId,
      size: p.size,
      n: p.n ?? p.count ?? 1,
      quality: p.quality,
      style: p.style,
      responseFormat: p.responseFormat ?? "url",
      negative: p.negative,
    }
  }
  if (type === "video") {
    return {
      prompt: prompt.slice(0, 3000),
      modelId: apiModelId,
      duration: p.duration,
      width: p.width,
      height: p.height,
      fps: p.fps,
      size: p.size,
      ratio: p.ratio,
      n: p.n ?? p.count ?? 1,
      seed: p.seed,
      negative: p.negative,
    }
  }
  return {
    prompt: prompt.slice(0, 4096),
    modelId: apiModelId,
    voice: p.voice,
    responseFormat: p.responseFormat ?? "mp3",
    speed: p.speed,
    duration: p.duration,
  }
}
