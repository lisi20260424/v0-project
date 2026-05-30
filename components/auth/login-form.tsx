"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { translateAuthError } from "@/lib/auth-errors"
import { platformAPI } from "@/lib/platform-api"
import { OAuthButtons } from "./oauth-buttons"

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard"
  return value
}

export function LoginForm() {
  const searchParams = useSearchParams()
  const next = safeNextPath(searchParams.get("next"))

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handlePasswordLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return

    setError(null)
    setLoading(true)
    try {
      const json = await platformAPI.login(email, password)
      const data = json.data ?? json
      if (!data.accessToken || !data.refreshToken) {
        throw new Error("登录响应缺少令牌")
      }

      localStorage.setItem("accessToken", data.accessToken)
      localStorage.setItem("refreshToken", data.refreshToken)
      window.dispatchEvent(new Event("auth-token-changed"))
      window.location.assign(next)
    } catch (err) {
      setError(translateAuthError(err, "登录失败，请检查账号密码"))
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5 text-center">
        <h1 className="text-2xl font-bold tracking-tight">欢迎回来</h1>
        <p className="text-sm text-muted-foreground">登录你的账号，继续使用创作平台</p>
      </div>

      <OAuthButtons redirectTo={next} />

      <div className="relative flex items-center">
        <div className="flex-1 border-t border-border" />
        <span className="px-3 text-[11px] uppercase tracking-wider text-muted-foreground">邮箱密码登录</span>
        <div className="flex-1 border-t border-border" />
      </div>

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
            <Link href="/auth/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
              忘记密码？
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="请输入密码"
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

      <p className="text-center text-xs text-muted-foreground">
        还没有账号？{" "}
        <Link href="/auth/sign-up" className="font-medium text-foreground hover:text-primary">
          去注册
        </Link>
      </p>
    </div>
  )
}
