"use client"

import { useState } from "react"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { platformAPI } from "@/lib/platform-api"

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("")
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
      setError("两次输入的新密码不一致")
      return
    }
    const token = localStorage.getItem("accessToken")
    if (!token) {
      setError("请先登录")
      return
    }
    setLoading(true)
    try {
      await platformAPI.changePassword(token, currentPassword, password)
      setSuccess(true)
      setCurrentPassword("")
      setPassword("")
      setConfirmPassword("")
      setTimeout(() => setSuccess(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新密码失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="current_password">当前密码</Label>
          <Input id="current_password" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} disabled={loading} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new_password">新密码</Label>
          <Input id="new_password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm_new_password">确认新密码</Label>
          <Input id="confirm_new_password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} />
        </div>
      </div>
      {error ? <Message tone="error" message={error} /> : null}
      {success ? <Message tone="success" message="密码已更新，其他登录会话已失效。" /> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? <Spinner className="mr-2 h-4 w-4" /> : null}
          {loading ? "更新中..." : "更新密码"}
        </Button>
      </div>
    </form>
  )
}

function Message({ tone, message }: { tone: "error" | "success"; message: string }) {
  const isError = tone === "error"
  const Icon = isError ? AlertCircle : CheckCircle2
  return (
    <div className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${isError ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-primary/30 bg-primary/10 text-primary"}`}>
      <Icon className="h-3.5 w-3.5" />
      {message}
    </div>
  )
}