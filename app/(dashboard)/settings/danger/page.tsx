import { AlertTriangle } from "lucide-react"
import { DeleteAccountDialog } from "@/components/settings/delete-account-dialog"

export const metadata = { title: "账号注销 | 账户设置" }

export default async function DangerPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-destructive"><AlertTriangle className="h-4 w-4" />危险操作区</h2>
        <p className="mt-2 text-sm text-muted-foreground">账号注销将通过 Go API `/v1/account/delete` 执行。</p>
      </section>
      <section className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-base font-semibold">永久删除账号</h3>
        <p className="mt-2 text-sm text-muted-foreground">删除后账号数据将不可恢复，请谨慎操作。</p>
        <div className="mt-4"><DeleteAccountDialog email="" /></div>
      </section>
    </div>
  )
}
