"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, ArrowLeft, CheckCircle2, MailCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { OAuthButtons } from "./oauth-buttons"
import { OtpInput } from "./otp-input"
import { translateAuthError } from "@/lib/auth-errors"

type Mode = "password" | "otp"
type OtpStep = "email" | "verify"

const RESEND_SECONDS = 60

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get("next") ?? "/dashboard"

  const [mode, setMode] = useState<Mode>("password")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [otpStep, setOtpStep] = useState<OtpStep>("email")
  const [otp, setOtp] = useState("")
  const [cooldown, setCooldown] = useState(0)

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setOtp("")
    setOtpStep("email")
  }

  async function handlePasswordLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      if (data?.session) {
        // 等待一下确保 provider 已经更新了用户状态
        await new Promise((resolve) => setTimeout(resolve, 500))
        router.push(next)
        router.refresh()
      }
    } catch (err) {
      setError(translateAuthError(err, "登录失败，请检查账号密码"))
      setLoading(false)
    }
  }

  async function sendOtp(isResend = false) {
    setError(null)
    if (!email) {
      setError("请先输入邮箱")
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      setOtpStep("verify")
      setOtp("")
      setCooldown(RESEND_SECONDS)
    } catch (err) {
      setError(translateAuthError(err, "发送验证码失败，请稍后重试"))
    } finally {
      setLoading(false)
    }
  }

  async function handleOtpEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    await sendOtp(false)
  }

  async function verifyOtp(code: string) {
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      })
      if (error) throw error
      if (data?.session) {
        // 等待一下确保 provider 已经更新了用户状态
        await new Promise((resolve) => setTimeout(resolve, 500))
        router.push(next)
        router.refresh()
      }
    } catch (err) {
      setError(translateAuthError(err, "验证码错误或已过期"))
      setOtp("")
      setLoading(false)
    }
  }

  async function handleOtpVerifySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (otp.length !== 6) {
      setError("请输入 6 位验证码")
      return
    }
    await verifyOtp(otp)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5 text-center">
        <h1 className="text-2xl font-bold tracking-tight">欢迎回来</h1>
        <p className="text-sm text-muted-foreground">登录你的灵境 AI 账号，继续创作之旅</p>
      </div>

      <OAuthButtons redirectTo={next} />

      <div className="relative flex items-center">
        <div className="flex-1 border-t border-border" />
        <span className="px-3 text-[11px] uppercase tracking-wider text-muted-foreground">或使用邮箱登录</span>
        <div className="flex-1 border-t border-border" />
      </div>

      <div className="inline-flex self-center rounded-lg border border-border bg-background/50 p-1">
        <button
          type="button"
          onClick={() => switchMode("password")}
          className={cn(
            "rounded-md px-4 py-1.5 text-xs font-medium transition-colors",
            mode === "password"
              ? "bg-primary/15 text-primary ring-1 ring-primary/40"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          密码登录
        </button>
        <button
          type="button"
          onClick={() => switchMode("otp")}
          className={cn(
            "rounded-md px-4 py-1.5 text-xs font-medium transition-colors",
            mode === "otp"
              ? "bg-primary/15 text-primary ring-1 ring-primary/40"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          验证码登录
        </button>
      </div>

      {mode === "password" ? (
        <form onSubmit={handlePasswordLogin} className="flex flex-col gap-4">
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">密码</Label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                忘记密码？
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="至少 8 位"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {error ? (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <Button type="submit" className="h-10" disabled={loading}>
            {loading ? <Spinner className="mr-2 h-4 w-4" /> : null}
            {loading ? "登录中..." : "登录"}
          </Button>
        </form>
      ) : otpStep === "email" ? (
        <form onSubmit={handleOtpEmailSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="otp_email">邮箱地址</Label>
            <Input
              id="otp_email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <p className="text-[11px] text-muted-foreground">我们将向此邮箱发送一封包含 6 位验证码的邮件</p>
          </div>

          {error ? (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <Button type="submit" className="h-10" disabled={loading}>
            {loading ? <Spinner className="mr-2 h-4 w-4" /> : null}
            {loading ? "发送中..." : "获取验证码"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleOtpVerifySubmit} className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MailCheck className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">
              验证码已发送至 <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>

          <OtpInput
            value={otp}
            onChange={setOtp}
            onComplete={(code) => {
              if (!loading) verifyOtp(code)
            }}
            disabled={loading}
          />

          {error ? (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <Button type="submit" className="h-10" disabled={loading || otp.length !== 6}>
            {loading ? <Spinner className="mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            {loading ? "验证中..." : "登录"}
          </Button>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => {
                setOtpStep("email")
                setOtp("")
                setError(null)
              }}
              className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
              disabled={loading}
            >
              <ArrowLeft className="h-3 w-3" />
              修改邮箱
            </button>
            <button
              type="button"
              onClick={() => sendOtp(true)}
              disabled={cooldown > 0 || loading}
              className="font-medium transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cooldown > 0 ? `${cooldown} 秒后可重新发送` : "重新发送验证码"}
            </button>
          </div>
        </form>
      )}

      <p className="text-center text-xs text-muted-foreground">
        还没有账号？{" "}
        <Link href="/auth/sign-up" className="font-medium text-foreground hover:text-primary">
          免费注册
        </Link>
      </p>
    </div>
  )
}
