"use client"

import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react"
import { platformAPI } from "@/lib/platform-api"
import { getPlatformSession } from "@/lib/platform-session"

type SecurityInfo = {
  email: string
  status: string
  role: string
  emailVerified: boolean
  activeSessions: number
  createdAt: string
  lastLoginAt?: string | null
}

export function SecuritySummary() {
  const [info, setInfo] = useState<SecurityInfo | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const session = getPlatformSession()
    if (!session?.accessToken) {
      setError("请先登录")
      return
    }
    platformAPI.getSecurity(session.accessToken)
      .then((res) => setInfo(res.data ?? res))
      .catch((err) => setError(err instanceof Error ? err.message : "加载安全信息失败"))
  }, [])

  if (error) {
    return <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"><AlertCircle className="h-3.5 w-3.5" />{error}</div>
  }

  if (!info) {
    return <div className="text-sm text-muted-foreground">正在加载账户安全信息...</div>
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Info label="登录邮箱" value={info.email} />
      <Info label="账户状态" value={info.status} />
      <Info label="账户角色" value={info.role} />
      <Info label="活跃会话" value={`${info.activeSessions} 个`} />
      <Info label="注册时间" value={formatTime(info.createdAt)} />
      <Info label="最近登录" value={info.lastLoginAt ? formatTime(info.lastLoginAt) : "暂无记录"} />
      <div className="md:col-span-2">
        <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
          {info.emailVerified ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
          {info.emailVerified ? "邮箱已验证" : "邮箱尚未验证"}
        </div>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-border bg-background/60 p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 text-sm font-medium">{value}</div></div>
}

function formatTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false })
}
