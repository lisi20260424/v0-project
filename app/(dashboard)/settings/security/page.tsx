import { redirect } from "next/navigation"
import { Mail, ShieldAlert, KeyRound } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { PasswordForm } from "@/components/settings/password-form"

export const metadata = {
  title: "账户安全 · 账户设置",
}

export default async function SecurityPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login?next=/settings/security")

  const emailConfirmed = Boolean(user.email_confirmed_at)
  const lastSignIn = user.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleString("zh-CN", { hour12: false })
    : "—"
  const provider = user.app_metadata?.provider ?? "email"

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

        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <InfoItem label="邮箱" value={user.email ?? "—"} />
          <InfoItem
            label="邮箱状态"
            value={
              <span
                className={
                  emailConfirmed
                    ? "inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary"
                    : "inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400"
                }
              >
                {emailConfirmed ? "已验证" : "未验证"}
              </span>
            }
          />
          <InfoItem label="登录方式" value={provider === "email" ? "邮箱 + 密码" : provider} />
          <InfoItem label="上次登录" value={lastSignIn} />
        </dl>
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

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  )
}
