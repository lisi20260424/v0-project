"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"

export function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
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

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "重置失败，请重新尝试")
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5 text-center">
        <h1 className="text-2xl font-bold tracking-tight">设置新密码</h1>
        <p className="text-sm text-muted-foreground">请输入你的新密码，完成重置后将自动登录</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">新密码</Label>
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
          <Label htmlFor="confirm_password">确认新密码</Label>
          <Input
            id="confirm_password"
            type="password"
            autoComplete="new-password"
            placeholder="再次输入新密码"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
          {loading ? "提交中..." : "重置密码"}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        <Link href="/auth/login" className="font-medium text-foreground hover:text-primary">
          返回登录
        </Link>
      </p>
    </div>
  )
}
