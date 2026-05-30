import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/supabase/get-user"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1)
  const pageSize = Math.min(50, Math.max(10, Number(url.searchParams.get("pageSize") ?? "20") || 20))
  const type = url.searchParams.get("type") // 筛选：video/image/music/all
  const status = url.searchParams.get("status") // 筛选：success/running/failed/all

  const offset = (page - 1) * pageSize

  const supabase = await createClient()

  // 构建查询
  let query = supabase
    .from("generation_tasks")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // 按类型筛选
  if (type && type !== "all") {
    query = query.eq("type", type)
  }

  // 按状态筛选
  if (status && status !== "all") {
    query = query.eq("status", status)
  }

  // 分页
  query = query.range(offset, offset + pageSize - 1)

  const { data, count, error } = await query

  if (error) {
    console.error("[v0] 获取消费记录失败:", error)
    return NextResponse.json({ error: "获取消费记录失败" }, { status: 500 })
  }

  const tasks = (data ?? []).map((task) => ({
    id: task.id,
    type: task.type,
    status: task.status,
    tool_label: task.tool_label || `${task.provider_name || "未知"} ${task.model_name || ""}`,
    cost: task.cost || 0,
    created_at: task.created_at,
    completed_at: task.completed_at,
    error_message: task.error_message,
  }))

  return NextResponse.json({
    data: tasks,
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  })
}
