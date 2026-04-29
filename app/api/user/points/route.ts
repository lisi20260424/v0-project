import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/get-user"
import { getUserPointsStats, getUserPointsHistory } from "@/lib/points"

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const url = new URL(request.url)
    const type = url.searchParams.get("type") || "stats" // stats 或 history

    if (type === "stats") {
      // 获取点数统计
      const stats = await getUserPointsStats(user.id)
      return NextResponse.json(stats)
    } else if (type === "history") {
      // 获取消费历史
      const limit = Math.min(50, Number(url.searchParams.get("limit") || "10"))
      const offset = Math.max(0, Number(url.searchParams.get("offset") || "0"))

      const history = await getUserPointsHistory(user.id, limit, offset)
      return NextResponse.json(history)
    }

    return NextResponse.json({ error: "未知的查询类型" }, { status: 400 })
  } catch (error) {
    console.error("[v0] 获取点数信息失败:", error)
    return NextResponse.json({ error: "获取失败" }, { status: 500 })
  }
}
