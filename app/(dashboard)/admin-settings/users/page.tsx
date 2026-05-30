import { UsersManager } from "@/components/admin/users-manager"

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  return <div className="flex flex-col gap-6"><header><h1 className="text-2xl font-bold tracking-tight">用户管理</h1><p className="mt-1 text-sm text-muted-foreground">用户数据通过 Go API `/v1/admin/users` 加载。</p></header><UsersManager /></div>
}
