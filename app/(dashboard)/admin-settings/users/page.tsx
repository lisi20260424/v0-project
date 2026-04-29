import { getCurrentUser } from "@/lib/supabase/get-user"
import { UsersManager } from "@/components/admin/users-manager"

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  const user = await getCurrentUser()

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight">用户管理</h1>
        <p className="text-sm text-muted-foreground">
          管理平台用户信息、用户类型、会员等级、点数余额和账号状态。仅管理员可见。
        </p>
      </header>

      <UsersManager currentUser={user} />
    </div>
  )
}
