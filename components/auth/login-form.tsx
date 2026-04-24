"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { OAuthButtons } from "./oauth-buttons"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get("next") ?? "/dashboard"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push(next)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败，请检查账号密码")
      setLoading(false)
    }
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

      <p className="text-center text-xs text-muted-foreground">
        还没有账号？{" "}
        <Link href="/auth/sign-up" className="font-medium text-foreground hover:text-primary">
          免费注册
        </Link>
      </p>
    </div>
  )
}
