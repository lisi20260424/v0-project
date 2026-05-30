import { Mail, ShieldAlert, KeyRound } from "lucide-react"
import { PasswordForm } from "@/components/settings/password-form"
import { SecuritySummary } from "@/components/settings/security-summary"

export const metadata = {
  title: "账户安全 · 账户设置",
}

export default async function SecurityPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Mail className="h-4 w-4 text-muted-foreground" />
            登录账号
          </h2>
          <p className="text-xs text-muted-foreground">你当前的登录方式与基础信息</p>
        </div>
        <div className="mt-5">
          <SecuritySummary />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            修改密码
          </h2>
          <p className="text-xs text-muted-foreground">建议定期更换密码，不要与其他网站重复</p>
        </div>
        <div className="mt-5">
          <PasswordForm />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              两步验证（即将上线）
            </h2>
            <p className="text-xs text-muted-foreground">启用后，登录时除密码外还需输入动态验证码</p>
          </div>
          <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
            Coming Soon
          </span>
        </div>
      </section>
    </div>
  )
}
