import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isAdminEmail, getAdminEmails } from "@/lib/admin"

/**
 * 服务端鉴权：要求当前会话是管理员，否则重定向。
 * 用于管理员相关的 layout / page。
 */
export async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?next=/settings")
  }

  const adminEmails = getAdminEmails()
  const userEmail = user.email?.trim().toLowerCase()
  const isAdmin = isAdminEmail(user.email)

  console.log("[v0] Admin check:", {
    userEmail,
    adminEmails,
    isAdmin,
    envValue: process.env.ADMIN_EMAILS,
  })

  if (!isAdmin) {
    console.log("[v0] User not admin, redirecting from /admin/settings to /settings/profile")
    redirect("/settings/profile")
  }

  return user
}

/**
 * Route Handler 中使用：返回是否为管理员，不进行重定向。
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return isAdminEmail(user?.email)
}
