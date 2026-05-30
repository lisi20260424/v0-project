import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdminUser } from "@/lib/admin"

async function ensureAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminUser(user)) return null
  return user
}

export async function GET(request: Request) {
  const user = await ensureAdmin()
  if (!user) return NextResponse.json({ error: "无权限" }, { status: 403 })

  const url = new URL(request.url)
  const search = (url.searchParams.get("search") ?? "").trim()
  const userType = (url.searchParams.get("userType") ?? "").trim()
  const status = (url.searchParams.get("status") ?? "").trim()
  const vipTier = (url.searchParams.get("vipTier") ?? "").trim()
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1)
  const pageSize = Math.min(100, Math.max(5, Number(url.searchParams.get("pageSize") ?? "20") || 20))
  const offset = (page - 1) * pageSize

  console.log("[v0] 获取用户列表: search=", search, "userType=", userType, "status=", status, "vipTier=", vipTier, "page=", page, "pageSize=", pageSize)

  const admin = createAdminClient()
  const { data, error } = await admin.rpc("admin_list_users", {
    p_search: search,
    p_user_type: userType,
    p_status: status,
    p_vip_tier: vipTier,
    p_limit: pageSize,
    p_offset: offset,
  })

  console.log("[v0] RPC 返回数据:", { data, error })

  if (error) {
    console.error("[v0] admin_list_users error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (data ?? []) as Array<{
    id: string
    email: string | null
    display_name: string | null
    avatar_url: string | null
    points: number
    user_type: string
    status: string
    vip_tier: string | null
    vip_expires_at: string | null
    created_at: string
    last_sign_in_at: string | null
    total_count: number
  }>

  const total = rows[0]?.total_count ?? 0

  console.log("[v0] 返回用户数据:", { count: rows.length, total })

  return NextResponse.json({
    users: rows.map(({ total_count, ...rest }) => rest),
    total: Number(total),
    page,
    pageSize,
  })
}
