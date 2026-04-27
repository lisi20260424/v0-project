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
  console.log(`[v0:task:get] taskId=${id.slice(0, 8)}... | user=${user.id.slice(0, 8)}...`)

  const { data: task, error } = await supabase
    .from("generation_tasks")
    .select("*")
    .eq("id", id)
    .single()
  if (error || !task) {
    console.warn(`[v0:task:get:not-found] taskId=${id.slice(0, 8)}...`)
    return Response.json({ error: "任务不存在" }, { status: 404 })
  }

  const updated = await maybePollVideoTask(task)
  console.log(`[v0:task:get:complete] status=${updated.status} | progress=${updated.progress}`)
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
  console.log(`[v0:task:delete] taskId=${id.slice(0, 8)}... | user=${user.id.slice(0, 8)}...`)

  const { error } = await supabase.from("generation_tasks").delete().eq("id", id)
  if (error) {
    console.error(`[v0:task:delete:error] ${error.message}`)
    return Response.json({ error: error.message }, { status: 500 })
  }
  console.log(`[v0:task:delete:complete] taskId=${id.slice(0, 8)}...`)
  return Response.json({ success: true })
}

/**
 * 从 Sora 获取实际的视频内容 URL
 */
async function fetchSoraContent(
  baseURL: string,
  apiKey: string,
  contentPathTemplate: string,
  taskId: string,
): Promise<string[] | null> {
  const contentPath = contentPathTemplate.replace("{taskId}", encodeURIComponent(taskId))
  const url = contentPath.startsWith("http") ? contentPath : `${baseURL}${contentPath.startsWith("/") ? contentPath : `/${contentPath}`}`

  console.log(`[v0:sora:content:fetch] url=${url}`)
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "unknown")
    const error = `Sora 内容获取失败 (${res.status}): ${text.slice(0, 200)}`
    console.error(`[v0:sora:content:error] ${error}`)
    throw new Error(error)
  }

  const json = await res.json()
  console.log(`[v0:sora:content:parsed] response keys=${Object.keys(json).join(", ").slice(0, 100)}`)

  // 尝试从多个可能的字段提取 URL
  const urls: string[] = []
  if (typeof json?.url === "string") urls.push(json.url)
  else if (typeof json?.video_url === "string") urls.push(json.video_url)
  else if (typeof json?.data?.url === "string") urls.push(json.data.url)
  else if (typeof json?.data?.video_url === "string") urls.push(json.data.video_url)
  else if (Array.isArray(json?.data)) {
    for (const d of json.data) {
      if (typeof d?.url === "string") urls.push(d.url)
      else if (typeof d?.video_url === "string") urls.push(d.video_url)
    }
  } else if (Array.isArray(json?.videos)) {
    for (const v of json.videos) {
      if (typeof v?.url === "string") urls.push(v.url)
      else if (typeof v?.video_url === "string") urls.push(v.video_url)
    }
  }

  console.log(`[v0:sora:content:extracted] urls=${urls.length}`)
  return urls.length > 0 ? urls : null
}

/**
 * 当任务是「running 状态的异步视频任务」时，触发上游轮询并写回 DB；否则原样返回
 */
async function maybePollVideoTask(task: any) {
  if (task.status !== "running") return task
  if (task.type !== "video") return task
  if (!task.provider_task_id) return task

  const lastPolledAt = task.last_polled_at ? new Date(task.last_polled_at).getTime() : 0
  const timeSinceLastPoll = Date.now() - lastPolledAt
  if (timeSinceLastPoll < 2000) {
    console.log(`[v0:poll:throttle] taskId=${task.id.slice(0, 8)}... | next poll in ${2000 - timeSinceLastPoll}ms`)
    return task
  }

  console.log(`[v0:poll:trigger] taskId=${task.id.slice(0, 8)}... | provider=${task.provider_name}`)

  const admin = createAdminClient()

  let gateway
  try {
    gateway = await getGatewayConfig()
  } catch (err) {
    console.warn(`[v0:poll:error:gateway] ${err instanceof Error ? err.message : "gateway not available"}`)
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
    const msg = err instanceof Error ? err.message : "poll error"
    console.error(`[v0:poll:error:upstream] taskId=${task.id.slice(0, 8)}... | ${msg}`)
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
    console.log(`[v0:poll:success] taskId=${task.id.slice(0, 8)}... | urls=${result.urls?.length ?? 0}`)
    patch.status = "success"
    patch.progress = 100
    patch.result_urls = result.urls

    // Sora 特殊处理：若配置了 contentPath，则需要从中获取实际的视频下载 URL
    if (task.provider_name === "sora" && endpoint.contentPath) {
      try {
        console.log(`[v0:poll:sora:fetch-content] taskId=${task.id.slice(0, 8)}...`)
        const contentUrls = await fetchSoraContent(
          gateway.gateway_url,
          gateway.api_key,
          endpoint.contentPath,
          task.provider_task_id,
        )
        if (contentUrls && contentUrls.length > 0) {
          console.log(`[v0:poll:sora:content-ok] urls=${contentUrls.length}`)
          patch.result_urls = contentUrls
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown"
        console.warn(`[v0:poll:sora:content-failed] ${msg}`)
        // 即使失败也不影响，使用轮询返回的 URL
      }
    }

    patch.completed_at = new Date().toISOString()
  } else if (result.status === "failed") {
    console.log(`[v0:poll:failed] taskId=${task.id.slice(0, 8)}... | error=${result.error}`)
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
    console.log(`[v0:poll:running] taskId=${task.id.slice(0, 8)}... | progress=${patch.progress}`)
  }

  const { data: updated } = await admin
    .from("generation_tasks")
    .update(patch)
    .eq("id", task.id)
    .select()
    .single()

  console.log(`[v0:poll:db-update] taskId=${task.id.slice(0, 8)}... | updated=${!!updated}`)
  return updated ?? task
}
