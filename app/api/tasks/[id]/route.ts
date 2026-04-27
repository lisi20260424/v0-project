import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  getEndpointForModel,
  getGatewayConfig,
  pollProviderTask,
} from "@/lib/ai-provider"
import type { VideoFormat } from "@/lib/api-formats"

export const dynamic = "force-dynamic"

/**
 * GET /api/tasks/[id] - 查询任务最新状态
 *  - 若任务为 running 视频任务且距上次轮询 ≥ 2 秒，则触发上游轮询并写回 DB
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "未登录" }, { status: 401 })

  const { id } = await params

  const { data: task, error } = await supabase
    .from("generation_tasks")
    .select("*")
    .eq("id", id)
    .single()
  if (error || !task) return Response.json({ error: "任务不存在" }, { status: 404 })

  const updated = await maybePollVideoTask(task)
  return Response.json({ task: updated })
}

/**
 * DELETE /api/tasks/[id] - 删除任务（仅当前用户）
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "未登录" }, { status: 401 })

  const { id } = await params

  const { error } = await supabase.from("generation_tasks").delete().eq("id", id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}

/**
 * 当任务是「running 状态的异步视频任务」时，触发上游轮询并写回 DB；否则原样返回
 */
async function maybePollVideoTask(task: any) {
  if (task.status !== "running") return task
  if (task.type !== "video") return task
  if (!task.provider_task_id) return task

  const lastPolledAt = task.last_polled_at ? new Date(task.last_polled_at).getTime() : 0
  if (Date.now() - lastPolledAt < 2000) return task // 节流

  const admin = createAdminClient()

  let gateway
  try {
    gateway = await getGatewayConfig()
  } catch {
    return task
  }

  const endpoint = await getEndpointForModel(task.provider_name ?? "", "video")

  let result
  try {
    result = await pollProviderTask(
      gateway.gateway_url,
      gateway.api_key,
      endpoint.format as VideoFormat,
      task.provider_task_id,
      endpoint.pollPath,
    )
  } catch (err) {
    console.error("[v0] pollProviderTask error", err)
    await admin
      .from("generation_tasks")
      .update({ last_polled_at: new Date().toISOString() })
      .eq("id", task.id)
    return task
  }

  const patch: Record<string, any> = {
    last_polled_at: new Date().toISOString(),
    provider_raw: result.raw as any,
  }

  if (result.status === "success") {
    patch.status = "success"
    patch.progress = 100
    patch.result_urls = result.urls
    patch.completed_at = new Date().toISOString()
  } else if (result.status === "failed") {
    patch.status = "failed"
    patch.error_message = result.error
    patch.completed_at = new Date().toISOString()
  } else {
    if (typeof result.progress === "number") {
      patch.progress = Math.max(task.progress ?? 0, Math.min(99, Math.floor(result.progress)))
    } else {
      // 没有进度信息时，缓慢自增以提供视觉反馈
      patch.progress = Math.min(95, (task.progress ?? 0) + 3)
    }
  }

  const { data: updated } = await admin
    .from("generation_tasks")
    .update(patch)
    .eq("id", task.id)
    .select()
    .single()

  return updated ?? task
}
