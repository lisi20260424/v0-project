"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowLeft, Mail } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { OAuthButtons } from "./oauth-buttons"
import { translateAuthError } from "@/lib/auth-errors"

type Step = "form" | "confirm"

const RESEND_SECONDS = 60

export function SignUpForm() {
  const router = useRouter()

  const [step, setStep] = useState<Step>("form")
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [agree, setAgree] = useState(true)

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("密码至少需要 8 位")
      return
    }
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致")
      return
    }
    if (!agree) {
      setError("请先阅读并同意用户协议与隐私政策")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            display_name: displayName || email.split("@")[0],
          },
        },
      })
      if (error) throw error
      setStep("confirm")
    } catch (err) {
      setError(translateAuthError(err, "注册失败，请稍后重试"))
    } finally {
      setLoading(false)
    }
  }

  if (step === "confirm") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="h-6 w-6" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-bold tracking-tight">请确认你的邮箱</h1>
            <p className="text-sm text-muted-foreground">
              我们已向 <span className="font-medium text-foreground">{email}</span> 发送了确认链接，请查收邮件并点击确认
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm font-medium">接下来的步骤：</p>
          <ol className="space-y-2 text-xs text-muted-foreground">
            <li>1. 打开你的邮箱（检查垃圾箱）</li>
            <li>2. 找到来自我们的邮件</li>
            <li>3. 点击邮件中的"确认邮箱"按钮</li>
            <li>4. 完成后自动返回应用</li>
          </ol>
        </div>

        <Button
          onClick={() => {
            setStep("form")
            setError(null)
            setEmail("")
            setPassword("")
            setConfirmPassword("")
            setDisplayName("")
          }}
          variant="outline"
          className="h-10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回注册
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          未收到邮件？检查垃圾箱或{" "}
          <button
            onClick={() => {
              setStep("form")
              setError(null)
            }}
            className="font-medium text-foreground hover:text-primary"
          >
            重新注册
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5 text-center">
        <h1 className="text-2xl font-bold tracking-tight">创建你的账号</h1>
        <p className="text-sm text-muted-foreground">注册即可获得 100 点免费创作点数</p>
      </div>

      <OAuthButtons />

      <div className="relative flex items-center">
        <div className="flex-1 border-t border-border" />
        <span className="px-3 text-[11px] uppercase tracking-wider text-muted-foreground">或使用邮箱注册</span>
        <div className="flex-1 border-t border-border" />
      </div>

      <form onSubmit={handleSignUp} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="display_name">昵称（选填）</Label>
          <Input
            id="display_name"
            type="text"
            placeholder="创作者昵称"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={loading}
            maxLength={24}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">邮箱地址</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">密码</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="至少 8 位"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm_password">确认密码</Label>
          <Input
            id="confirm_password"
            type="password"
            autoComplete="new-password"
            placeholder="再次输入密码"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <label className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-border text-primary focus:ring-primary"
          />
          <span>
            我已阅读并同意{" "}
            <Link href="/legal/terms" className="text-foreground underline-offset-2 hover:underline">
              《用户服务协议》
            </Link>{" "}
            和{" "}
            <Link href="/legal/privacy" className="text-foreground underline-offset-2 hover:underline">
              《隐私政策》
            </Link>
          </span>
        </label>

        {error ? (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <Button type="submit" className="h-10" disabled={loading}>
          {loading ? <Spinner className="mr-2 h-4 w-4" /> : null}
          {loading ? "正在注册..." : "注册"}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        已有账号？{" "}
        <Link href="/auth/login" className="font-medium text-foreground hover:text-primary">
          立即登录
        </Link>
      </p>
    </div>
  )
}
