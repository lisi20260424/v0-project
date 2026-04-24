"use client"

import { Zap, Crown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useMembership } from "@/components/membership-provider"

export function DashboardUserCard() {
  const membership = useMembership()
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12 ring-2 ring-primary/20">
          <AvatarImage src="/placeholder-user.jpg" alt="用户头像" />
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
            灵
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold">创作者_2048</span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
              <Crown className="h-2.5 w-2.5" />
              Pro
            </span>
          </div>
          <p className="truncate text-xs text-muted-foreground">user_2048@lingjing.ai</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border/60 bg-secondary/40 p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Zap className="h-3 w-3 text-accent" fill="currentColor" />
            可用点数
          </span>
          <span className="font-semibold tabular-nums">1,280 / 3,000</span>
        </div>
        <Progress value={42} className="mt-2 h-1.5" />
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>会员期至 2026-08-20</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-8 bg-transparent text-xs"
          onClick={() => membership.open("membership")}
        >
          续费会员
        </Button>
        <Button size="sm" className="h-8 text-xs" onClick={() => membership.open("points")}>
          充值点数
        </Button>
      </div>
    </div>
  )
}
