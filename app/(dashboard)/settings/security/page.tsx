import { Mail, ShieldAlert, KeyRound } from "lucide-react"
import { PasswordForm } from "@/components/settings/password-form"
import { SecuritySummary } from "@/components/settings/security-summary"

export const metadata = { title: "账户安全 | 账户设置" }

export default async function SecurityPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Mail className="h-4 w-4 text-muted-foreground" />登录账户</h2>
        <p className="mt-2 text-sm text-muted-foreground">登录状态由前端 token 和 Go API `/v1/user/security` 维护。</p>
        <div className="mt-5"><SecuritySummary /></div>
      </section>
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><KeyRound className="h-4 w-4 text-muted-foreground" />修改密码</h2>
        <div className="mt-5"><PasswordForm /></div>
      </section>
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><ShieldAlert className="h-4 w-4 text-muted-foreground" />两步验证</h2>
        <p className="mt-2 text-sm text-muted-foreground">当前已支持邮箱 OTP 注册和密码重置。登录二次验证可在后续 SMTP 配置稳定后开启。</p>
      </section>
    </div>
  )
}