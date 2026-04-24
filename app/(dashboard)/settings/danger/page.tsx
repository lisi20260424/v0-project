import { redirect } from "next/navigation"
import { AlertTriangle } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { DeleteAccountDialog } from "@/components/settings/delete-account-dialog"

export const metadata = {
  title: "账号注销 · 账户设置",
}

export default async function DangerPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login?next=/settings/danger")

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <div className="flex flex-col gap-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-destructive">
            <AlertTriangle className="h-4 w-4" />
            危险操作区
          </h2>
          <p className="text-sm text-muted-foreground">
            账号注销是不可逆的操作，请务必谨慎。注销后所有作品、点数和会员权益将永久清除，且无法恢复。
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-base font-semibold">永久删除账户</h3>
            <p className="text-sm text-muted-foreground">
              将永久移除账号 <span className="font-medium text-foreground">{user.email}</span> 及其所有数据。
            </p>
          </div>

          <ul className="ml-4 list-disc space-y-1 text-xs text-muted-foreground">
            <li>删除后 30 天内你将无法使用相同邮箱重新注册</li>
            <li>未使用的点数和会员时长将不予退款</li>
            <li>已公开的作品将从作品广场移除</li>
            <li>订单记录将按财税法规保留 5 年后销毁</li>
          </ul>

          <div className="mt-2">
            <DeleteAccountDialog email={user.email ?? ""} />
          </div>
        </div>
      </section>
    </div>
  )
}
