"use client"

import { Crown, Zap } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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

  if (!user) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
        <p>登录后可查看积分、会员和任务数据。</p>
        <Button asChild size="sm" className="mt-3 w-full">
          <a href="/auth/login">登录</a>
        </Button>
      </div>
    )
  }

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
            {user.vipTier && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
                <Crown className="h-2.5 w-2.5" />
                {TIER_LABEL[user.vipTier]}
              </span>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border/60 bg-secondary/40 p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Zap className="h-3 w-3 text-accent" fill="currentColor" />
            可用积分
          </span>
          <span className="font-semibold tabular-nums text-foreground">{user.points.toLocaleString()} 点</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button size="sm" variant="outline" className="h-8 bg-transparent text-xs" onClick={() => membership.open("membership")}>
          会员
        </Button>
        <Button size="sm" className="h-8 text-xs" onClick={() => membership.open("points")}>
          充值
        </Button>
      </div>
    </div>
  )
}
