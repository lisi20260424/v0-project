import { createClient } from "@/lib/supabase/server"

/**
 * 计算用户的总消费点数
 * 通过统计所有已完成的任务的消费成本
 */
export async function calculateTotalPointsUsed(userId: string): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("generation_tasks")
    .select("cost")
    .eq("user_id", userId)
    .eq("status", "success")

  if (error) {
    console.error("[v0] 计算消费点数失败:", error)
    return 0
  }

  return (data || []).reduce((sum, task) => sum + (task.cost || 0), 0)
}

/**
 * 获取用户的点数统计信息
 */
export async function getUserPointsStats(userId: string) {
  const supabase = await createClient()

  // 获取用户当前可用点数
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("points")
    .eq("id", userId)
    .single()

  if (profileError) {
    console.error("[v0] 获取用户点数失败:", profileError)
    return null
  }

  // 计算已使用点数
  const totalUsed = await calculateTotalPointsUsed(userId)

  // 计算初始点数（可用点数 + 已使用点数）
  const initialPoints = (profile?.points || 0) + totalUsed

  return {
    initialPoints, // 初始获得的总点数
    available: profile?.points || 0, // 当前可用点数
    used: totalUsed, // 已消费点数
  }
}

/**
 * 获取用户的点数消费记录（分页）
 */
export async function getUserPointsHistory(
  userId: string,
  limit: number = 10,
  offset: number = 0
) {
  const supabase = await createClient()

  const { data, error, count } = await supabase
    .from("generation_tasks")
    .select("id, tool_label, model_name, cost, status, created_at, completed_at", {
      count: "exact",
    })
    .eq("user_id", userId)
    .eq("status", "success")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("[v0] 获取消费历史失败:", error)
    return { records: [], total: 0 }
  }

  return {
    records: data || [],
    total: count || 0,
  }
}
