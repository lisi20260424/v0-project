import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isAdminUser } from "@/lib/admin"

/**
 * 服务端鉴权：要求当前会话是管理员，否则重定向。
 * 用于管理员相关的 layout / page。
 *
 * 管理员判定：user.app_metadata.role === 'admin'
 */
export async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?next=/admin-settings")
  }

  if (!isAdminUser(user)) {
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
  return isAdminUser(user)
}
