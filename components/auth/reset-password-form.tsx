"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { platformAPI } from "@/lib/platform-api"

export function ResetPasswordForm() {
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(false)
    if (password.length < 8) {
      setError("新密码至少需要 8 位")
      return
    }
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致")
      return
    }
    setLoading(true)
    try {
      await platformAPI.resetPassword(email, otp, password)
      setSuccess(true)
      setOtp("")
      setPassword("")
      setConfirmPassword("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "重置密码失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5 text-center">
        <h1 className="text-2xl font-bold tracking-tight">设置新密码</h1>
        <p className="text-sm text-muted-foreground">使用邮箱验证码设置新密码，成功后请重新登录。</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">邮箱地址</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="otp">验证码</Label>
          <Input id="otp" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} disabled={loading} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">新密码</Label>
          <Input id="password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPassword">确认新密码</Label>
          <Input id="confirmPassword" type="password" autoComplete="new-password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} />
        </div>
        {error ? <Message tone="error" message={error} /> : null}
        {success ? <Message tone="success" message="密码已重置，请返回登录。" /> : null}
        <Button type="submit" className="h-10" disabled={loading}>
          {loading ? <Spinner className="mr-2 h-4 w-4" /> : null}
          {loading ? "提交中..." : "重置密码"}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        没有验证码？{" "}
        <Link href="/auth/forgot-password" className="font-medium text-foreground hover:text-primary">
          发送验证码
        </Link>
        {" · "}
        <Link href="/auth/login" className="font-medium text-foreground hover:text-primary">
          返回登录
        </Link>
      </p>
    </div>
  )
}

function Message({ tone, message }: { tone: "error" | "success"; message: string }) {
  const isError = tone === "error"
  const Icon = isError ? AlertCircle : CheckCircle2
  return (
    <div className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs ${isError ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-primary/30 bg-primary/10 text-primary"}`}>
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
