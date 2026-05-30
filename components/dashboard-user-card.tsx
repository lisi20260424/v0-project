"use client"

import { platformAuthFetch } from "@/lib/platform-session"

import { useEffect, useState } from "react"
import { Zap, Crown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useMembership } from "@/components/membership-provider"
import { useUser } from "@/components/user-provider"

const TIER_LABEL: Record<"monthly" | "annual" | "lifetime", string> = {
  monthly: "月会员",
  annual: "年会员",
  lifetime: "终身会员",
}

export function DashboardUserCard() {
  const membership = useMembership()
  const { user } = useUser()
  const [stats, setStats] = useState<{
    initialPoints: number
    available: number
    used: number
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchStats = async () => {
      try {
        const res = await platformAuthFetch("/v1/user/points?type=stats")
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (error) {
        console.error("[v0] 获取点数统计失败:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  if (!user) return null

  const available = user.points
  const used = stats?.used || 0
  const total = available + used
  const percent = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0
  const initial = (user.displayName || user.email || "U").slice(0, 1).toUpperCase()

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12 ring-2 ring-primary/20">
          <AvatarImage src={user.avatarUrl ?? undefined} alt="用户头像" />
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
            {initial}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold">{user.displayName}</span>
            {user.vipTier ? (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                <Crown className="h-2.5 w-2.5" />
                {TIER_LABEL[user.vipTier]}
              </span>
            ) : (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                免费
              </span>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border/60 bg-secondary/40 p-3">
        <div className="space-y-2">
          {/* 可用点数 */}
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Zap className="h-3 w-3 text-accent" fill="currentColor" />
              可用点数
            </span>
            <span className="font-semibold tabular-nums text-foreground">
              {available.toLocaleString()} 点
            </span>
          </div>

          {/* 已使用点数 */}
          {!loading && used > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">已使用点数</span>
              <span className="tabular-nums text-muted-foreground">
                {used.toLocaleString()} 点
              </span>
            </div>
          )}

          {/* 进度条 - 显示已使用的比例 */}
          {total > 0 && (
            <>
              <Progress value={percent} className="mt-2 h-1.5" />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  {Math.round(percent)}% {total > 0 ? "已使用" : ""}
                </span>
                <span className="tabular-nums">
                  {total.toLocaleString()} 点总计
                </span>
              </div>
            </>
          )}
        </div>

        <div className="mt-2 text-[11px] text-muted-foreground">
          {user.vipTier ? "会员有效期内" : "升级解锁更多权益"}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-8 bg-transparent text-xs"
          onClick={() => membership.open("membership")}
        >
          {user.vipTier ? "续费会员" : "开通会员"}
        </Button>
        <Button size="sm" className="h-8 text-xs" onClick={() => membership.open("points")}>
          充值点数
        </Button>
      </div>
    </div>
  )
}
