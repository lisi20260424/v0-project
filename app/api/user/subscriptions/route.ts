import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

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
    const status = searchParams.get("status") || "all"
    const kind = searchParams.get("kind") || "all"

    let query = supabase
      .from("subscription_orders")
      .select(
        "id, plan_code, plan_kind, plan_name, amount, original_amount, bonus_points, vip_tier, vip_starts_at, vip_expires_at, status, payment_method, paid_at, created_at",
        { count: "exact" },
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (status !== "all") {
      query = query.eq("status", status)
    }
    if (kind !== "all") {
      query = query.eq("plan_kind", kind)
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    const { data, error, count } = await query.range(from, to)

    if (error) {
      console.error("[v0] Failed to load subscriptions:", error)
      return NextResponse.json({ error: "加载失败" }, { status: 500 })
    }

    // 当前生效的会员
    const { data: profile } = await supabase
      .from("profiles")
      .select("vip_tier, vip_expires_at, points")
      .eq("id", user.id)
      .maybeSingle()

    const total = count ?? 0
    return NextResponse.json({
      data: data ?? [],
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      currentVip: {
        tier: profile?.vip_tier ?? null,
        expiresAt: profile?.vip_expires_at ?? null,
        points: profile?.points ?? 0,
      },
    })
  } catch (error) {
    console.error("[v0] Subscriptions API error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
