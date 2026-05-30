"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { platformAPI } from "@/lib/platform-api"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await platformAPI.forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "发送重置验证码失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5 text-center">
        <h1 className="text-2xl font-bold tracking-tight">找回密码</h1>
        <p className="text-sm text-muted-foreground">输入邮箱后，验证码会发送到邮件服务；开发环境会打印到 Go API 日志。</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
        {error ? <Message tone="error" message={error} /> : null}
        {sent ? <Message tone="success" message="如果账号存在，验证码已发送。请前往重置密码页面完成修改。" /> : null}
        <Button type="submit" className="h-10" disabled={loading}>
          {loading ? <Spinner className="mr-2 h-4 w-4" /> : null}
          {loading ? "发送中..." : "发送验证码"}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        收到验证码？{" "}
        <Link href="/auth/reset-password" className="font-medium text-foreground hover:text-primary">
          重置密码
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
