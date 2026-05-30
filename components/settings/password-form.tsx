"use client"

import { useState } from "react"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { platformAPI } from "@/lib/platform-api"
import { getPlatformSession } from "@/lib/platform-session"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!currentPassword) {
      setError("请输入当前密码")
      return
    }
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
      const session = getPlatformSession()
      if (!session?.accessToken) throw new Error("请先登录")
      await platformAPI.changePassword(session.accessToken, currentPassword, password)
      setSuccess(true)
      setCurrentPassword("")
      setPassword("")
      setConfirmPassword("")
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "修改失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <Label htmlFor="current_password">当前密码</Label>
          <Input
            id="current_password"
            type="password"
            autoComplete="current-password"
            placeholder="请输入当前密码"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new_password">新密码</Label>
          <Input
            id="new_password"
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
          <Label htmlFor="confirm_new_password">确认新密码</Label>
          <Input
            id="confirm_new_password"
            type="password"
            autoComplete="new-password"
            placeholder="再次输入新密码"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {success ? (
        <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>密码已更新</span>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? <Spinner className="mr-2 h-4 w-4" /> : null}
          {loading ? "更新中..." : "更新密码"}
        </Button>
      </div>
    </form>
  )
}
