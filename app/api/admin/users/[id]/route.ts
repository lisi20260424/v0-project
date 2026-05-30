import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdminUser, USER_TYPES, USER_STATUSES, VIP_TIERS } from "@/lib/admin"

async function ensureAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminUser(user)) return null
  return user
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin_user = await ensureAdmin()
  if (!admin_user) return NextResponse.json({ error: "无权限" }, { status: 403 })

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "参数无效" }, { status: 400 })
  }

  const update: Record<string, unknown> = {}

  if (typeof body.displayName === "string" || body.displayName === null) {
    update.display_name = body.displayName ? String(body.displayName).trim() : null
  }
  if (typeof body.avatarUrl === "string" || body.avatarUrl === null) {
    update.avatar_url = body.avatarUrl ? String(body.avatarUrl).trim() : null
  }

  let nextUserType: string | undefined
  if (body.userType !== undefined) {
    if (!USER_TYPES.includes(body.userType)) {
      return NextResponse.json({ error: "用户类型无效" }, { status: 400 })
    }
    update.user_type = body.userType
    nextUserType = body.userType
  }

  if (body.status !== undefined) {
    if (!USER_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "用户状态无效" }, { status: 400 })
    }
    update.status = body.status
  }

  if (body.vipTier !== undefined) {
    if (body.vipTier === null || body.vipTier === "" || body.vipTier === "free") {
      update.vip_tier = null
    } else if (!VIP_TIERS.includes(body.vipTier)) {
      return NextResponse.json({ error: "会员等级无效" }, { status: 400 })
    } else {
      update.vip_tier = body.vipTier
    }
  }

  if (body.vipExpiresAt !== undefined) {
    if (body.vipExpiresAt === null || body.vipExpiresAt === "") {
      update.vip_expires_at = null
    } else {
      const date = new Date(body.vipExpiresAt)
      if (Number.isNaN(date.getTime())) {
        return NextResponse.json({ error: "会员到期时间无效" }, { status: 400 })
      }
      update.vip_expires_at = date.toISOString()
    }
  }

  if (body.points !== undefined) {
    const pts = Number(body.points)
    if (!Number.isFinite(pts) || pts < 0) {
      return NextResponse.json({ error: "点数必须是非负整数" }, { status: 400 })
    }
    update.points = Math.floor(pts)
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "没有可更新的字段" }, { status: 400 })
  }

  update.updated_at = new Date().toISOString()

  const admin = createAdminClient()

  // 1) 更新 profiles 表
  const { data, error } = await admin.from("profiles").update(update).eq("id", id).select().single()
  if (error) {
    console.log("[v0] update profile error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 2) 当用户类型变更时，同步 auth.users.app_metadata.role
  //    - user_type === 'admin'  → app_metadata.role = 'admin'
  //    - 其他类型               → 移除 app_metadata.role
  if (nextUserType !== undefined) {
    // 防止管理员误把自己降级
    if (id === admin_user.id && nextUserType !== "admin") {
      return NextResponse.json(
        { error: "不能取消自己的管理员权限，请先指定其他管理员" },
        { status: 400 },
      )
    }

    const { data: target } = await admin.auth.admin.getUserById(id)
    const currentMeta = (target?.user?.app_metadata ?? {}) as Record<string, unknown>
    const nextMeta: Record<string, unknown> = { ...currentMeta }

    if (nextUserType === "admin") {
      nextMeta.role = "admin"
    } else {
      delete nextMeta.role
    }

    const { error: metaError } = await admin.auth.admin.updateUserById(id, {
      app_metadata: nextMeta,
    })
    if (metaError) {
      console.log("[v0] update app_metadata error:", metaError.message)
      return NextResponse.json(
        { error: `更新管理员权限失败：${metaError.message}` },
        { status: 500 },
      )
    }
  }

  return NextResponse.json({ profile: data })
}
