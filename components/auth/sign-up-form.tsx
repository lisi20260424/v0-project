"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { translateAuthError } from "@/lib/auth-errors"
import { PlatformApiError, platformAPI } from "@/lib/platform-api"

function retryAfterSeconds(err: unknown): number {
  if (!(err instanceof PlatformApiError) || !err.data || typeof err.data !== "object") return 0
  const retryAfter = (err.data as { retryAfter?: unknown }).retryAfter
  return typeof retryAfter === "number" && Number.isFinite(retryAfter) ? Math.max(0, Math.ceil(retryAfter)) : 0
}

export function SignUpForm() {
  const router = useRouter()
  const [step, setStep] = useState<"profile" | "otp">("profile")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [otp, setOtp] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resendAfter, setResendAfter] = useState(0)

  useEffect(() => {
    if (resendAfter <= 0) return
    const timer = window.setInterval(() => {
      setResendAfter((current) => Math.max(0, current - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [resendAfter])

  async function requestOtp(e?: React.FormEvent<HTMLFormElement>) {
    e?.preventDefault()
    if (loading || resendAfter > 0) return

    setError(null)
    setLoading(true)
    try {
      await platformAPI.requestRegisterOtp(email, password, displayName)
      setStep("otp")
      setResendAfter(60)
    } catch (err) {
      const wait = retryAfterSeconds(err)
      if (wait > 0) setResendAfter(wait)
      setError(wait > 0 ? `验证码发送过于频繁，请 ${wait} 秒后再试` : translateAuthError(err, "发送验证码失败"))
    } finally {
      setLoading(false)
    }
  }

  async function verifyOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const json = await platformAPI.verifyRegisterOtp(email, otp)
      const data = json.data ?? json
      if (!data.accessToken || !data.refreshToken) {
        throw new Error("注册响应缺少令牌")
      }
      localStorage.setItem("accessToken", data.accessToken)
      localStorage.setItem("refreshToken", data.refreshToken)
      window.dispatchEvent(new Event("auth-token-changed"))
      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setError(translateAuthError(err, "验证码校验失败"))
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5 text-center">
        <h1 className="text-2xl font-bold tracking-tight">创建账号</h1>
        <p className="text-sm text-muted-foreground">
          {step === "profile" ? "使用邮箱和密码注册，验证码会发送到邮箱；本地开发环境会打印到 Go API 日志。" : "输入邮箱验证码完成注册。"}
        </p>
      </div>

      {step === "profile" ? (
        <form onSubmit={requestOtp} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="displayName">昵称</Label>
            <Input
              id="displayName"
              autoComplete="name"
              placeholder="可选"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading}
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
          {error ? <ErrorMessage message={error} /> : null}
          <Button type="submit" className="h-10" disabled={loading || resendAfter > 0}>
            {loading ? <Spinner className="mr-2 h-4 w-4" /> : null}
            {loading ? "发送中..." : resendAfter > 0 ? `${resendAfter} 秒后可重试` : "发送验证码"}
          </Button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="flex flex-col gap-4">
          <div className="rounded-md border border-border bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
            验证码已发送到 {email}。当前本地开发环境使用日志邮件服务，验证码会打印在 Go API 容器日志中。
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="otp">邮箱验证码</Label>
            <Input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6 位数字"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              disabled={loading}
            />
          </div>
          {error ? <ErrorMessage message={error} /> : null}
          <Button type="submit" className="h-10" disabled={loading}>
            {loading ? <Spinner className="mr-2 h-4 w-4" /> : null}
            {loading ? "注册中..." : "完成注册"}
          </Button>
          <Button type="button" variant="outline" disabled={loading || resendAfter > 0} onClick={() => requestOtp()}>
            {resendAfter > 0 ? `${resendAfter} 秒后可重新发送` : "重新发送验证码"}
          </Button>
          <Button type="button" variant="ghost" disabled={loading} onClick={() => setStep("profile")}>
            返回修改邮箱
          </Button>
        </form>
      )}

      <p className="text-center text-xs text-muted-foreground">
        已有账号？{" "}
        <Link href="/auth/login" className="font-medium text-foreground hover:text-primary">
          返回登录
        </Link>
      </p>
    </div>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
