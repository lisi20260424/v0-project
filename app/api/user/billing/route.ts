import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

type Direction = "in" | "out"
type RecordType = "recharge" | "refund" | "bonus" | "consumption"

type UnifiedRecord = {
  id: string
  type: RecordType
  direction: Direction
  amount: number | null
  points: number
  points_balance_after: number | null
  description: string
  payment_method: string | null
  related_order_id: string | null
  related_task_id: string | null
  created_at: string
}

const TASK_TYPE_LABEL: Record<string, string> = {
  video: "视频生成",
  image: "图像生成",
  music: "音乐生成",
  audio: "音频生成",
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)))
    const type = searchParams.get("type") || "all"
    const direction = searchParams.get("direction") || "all"

    // 1) billing_records 中的所有账单（充值/退款/赠送/消费）
    const { data: billingRows, error: billingErr } = await supabase
      .from("billing_records")
      .select(
        "id, type, direction, amount, points, points_balance_after, description, payment_method, related_order_id, related_task_id, created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (billingErr) {
      console.error("[v0] Failed to load billing_records:", billingErr)
      return NextResponse.json({ error: "加载失败" }, { status: 500 })
    }

    // 2) generation_tasks 中已完成的消费（兼容旧数据）
    const { data: taskRows, error: taskErr } = await supabase
      .from("generation_tasks")
      .select("id, type, tool_label, cost, status, created_at, completed_at")
      .eq("user_id", user.id)
      .eq("status", "success")
      .gt("cost", 0)
      .order("created_at", { ascending: false })

    if (taskErr) {
      console.error("[v0] Failed to load generation_tasks:", taskErr)
    }

    // 已经在 billing_records 里登记过的 task_id，避免重复
    const billedTaskIds = new Set(
      (billingRows ?? [])
        .filter((r) => r.type === "consumption" && r.related_task_id)
        .map((r) => r.related_task_id as string),
    )

    const taskRecords: UnifiedRecord[] = (taskRows ?? [])
      .filter((t) => !billedTaskIds.has(t.id))
      .map((t) => ({
        id: `task-${t.id}`,
        type: "consumption" as const,
        direction: "out" as const,
        amount: null,
        points: Number(t.cost ?? 0),
        points_balance_after: null,
        description: `${TASK_TYPE_LABEL[t.type] || "生成任务"}：${t.tool_label || ""}`.trim(),
        payment_method: null,
        related_order_id: null,
        related_task_id: t.id,
        created_at: t.completed_at || t.created_at,
      }))

    const billingRecords: UnifiedRecord[] = (billingRows ?? []).map((r) => ({
      id: r.id,
      type: r.type as RecordType,
      direction: r.direction as Direction,
      amount: r.amount as number | null,
      points: Number(r.points ?? 0),
      points_balance_after: r.points_balance_after as number | null,
      description: r.description,
      payment_method: r.payment_method,
      related_order_id: r.related_order_id,
      related_task_id: r.related_task_id,
      created_at: r.created_at,
    }))

    // 3) 合并 + 排序 + 过滤
    const allRecords = [...billingRecords, ...taskRecords].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )

    const filtered = allRecords.filter((r) => {
      if (type !== "all" && r.type !== type) return false
      if (direction !== "all" && r.direction !== direction) return false
      return true
    })

    // 4) 汇总统计（基于全部数据，不受筛选影响）
    const summary = {
      totalRecharge: 0,
      totalSpentPoints: 0,
      totalRefund: 0,
    }
    for (const r of allRecords) {
      if (r.type === "recharge" && r.direction === "in") {
        summary.totalRecharge += Number(r.amount ?? 0)
      } else if (r.type === "consumption" && r.direction === "out") {
        summary.totalSpentPoints += Number(r.points ?? 0)
      } else if (r.type === "refund" && r.direction === "in") {
        summary.totalRefund += Number(r.amount ?? 0)
      }
    }

    // 5) 分页
    const total = filtered.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const safePage = Math.min(page, totalPages)
    const from = (safePage - 1) * pageSize
    const data = filtered.slice(from, from + pageSize)

    return NextResponse.json({
      data,
      total,
      page: safePage,
      pageSize,
      totalPages,
      summary,
    })
  } catch (error) {
    console.error("[v0] Billing API error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
