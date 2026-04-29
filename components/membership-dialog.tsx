"use client"

import * as React from "react"
import { Check, Crown, Zap, ArrowUpCircle, CreditCard, Info, X, Sparkles } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type MembershipPlan = {
  id: string
  name: string
  price: number
  originalPrice: number
  perDay: string
  save: number
  bonusPoints: number
  badge?: string
  badgeTone?: "primary" | "accent" | "orange"
  recommended?: boolean
  features: string[]
}

type PointsPackage = {
  id: string
  points: number
  totalPoints: number
  price: number
  originalPrice: number
  perHundred: string
  save: number
  badge?: string
  features: string[]
  recommended?: boolean
}

const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: "monthly",
    name: "月会员",
    price: 29.8,
    originalPrice: 128,
    perDay: "约 1.0 元/天",
    save: 98.2,
    bonusPoints: 3000,
    badge: "限时优惠",
    badgeTone: "orange",
    features: ["赠送 3000 点数，点数永久有效", "专享点数消耗折扣", "付费点数永不过期，永久有效", "享受会员权益价"],
  },
  {
    id: "yearly",
    name: "年会员",
    price: 198,
    originalPrice: 398,
    perDay: "约 0.5 元/天",
    save: 200,
    bonusPoints: 20500,
    badge: "限时优惠",
    badgeTone: "orange",
    features: ["赠送 20500 点数，点数永久有效", "包含月会员所有权益", "尊享优化体验功能升级，功能上新", "尊享专属 1 对 1 客服", "享受会员权益价"],
  },
  {
    id: "lifetime",
    name: "终身会员",
    price: 298,
    originalPrice: 698,
    perDay: "约 9.9 元/年",
    save: 400,
    bonusPoints: 31000,
    badge: "最强选择",
    badgeTone: "primary",
    recommended: true,
    features: ["赠送 31000 点数，点数永久有效", "点数可用于 AI 编辑、AI 视频编辑全产品", "包含年度会员所有权益", "尊享专属 VIP1 客服", "享受会员权益价"],
  },
]

const POINTS_PACKAGES: PointsPackage[] = [
  {
    id: "p-3000",
    points: 3000,
    totalPoints: 5100,
    price: 50,
    originalPrice: 238,
    perHundred: "约 1.0 元/100 点",
    save: 188,
    badge: "限时优惠",
    features: [
      "含 5100 点数，点数永久有效",
      "点数可用于 AI 编辑、AI 视频编辑全产品",
      "付费点数永不过期，永久有效",
      "会员用户享受点数折扣",
      "丰富的创意视频模板全部可用",
    ],
  },
  {
    id: "p-20000",
    points: 20000,
    totalPoints: 20000,
    price: 190,
    originalPrice: 298,
    perHundred: "约 0.9 元/100 点",
    save: 108,
    badge: "限时优惠",
    features: ["含 20000 点数，点数永久有效", "包含 3000 点套餐所有权益", "尊享专属 1 对 1 客服"],
  },
  {
    id: "p-100000",
    points: 100000,
    totalPoints: 100000,
    price: 899,
    originalPrice: 1798,
    perHundred: "约 0.9 元/100 点",
    save: 899,
    badge: "限时优惠",
    features: ["含 100000 点数，点数永久有效", "尊享专属 VIP1 客服"],
  },
]

const POINT_COSTS = [
  { name: "Veo 3.1 Fast", desc: "Veo 视频生成服务（快速模式）", normal: 40, vip: 30 },
  { name: "Veo 3.1 Fast Components", desc: "Veo 视频生成服务（快速组件版，支持参考图）", normal: 50, vip: 30 },
  { name: "Veo 3.1 Fast 4K", desc: "Veo 视频生成服务（快速模式 4K 分辨率）", normal: 80, vip: 50 },
  { name: "Veo 3.1 Fast Components 4K", desc: "Veo 视频生成服务（快速组件版 4K 分辨率，支持参考图）", normal: 90, vip: 50 },
  { name: "Sora-2 视频", desc: "Sora-2 视频生成服务（标准模式）", normal: 400, vip: 200 },
  { name: "Sora-2 Pro", desc: "Sora-2 视频生成服务（Pro 高质量模式）", normal: 600, vip: 360 },
  { name: "可灵 2.1 标准", desc: "可灵视频生成服务（5 秒，720P）", normal: 35, vip: 25 },
  { name: "可灵 2.1 高质量", desc: "可灵视频生成服务（5 秒，1080P 高画质）", normal: 100, vip: 70 },
  { name: "Nano Banana", desc: "Nano 图像生成服务（标准版）", normal: 10, vip: 10 },
  { name: "Nano Banana Pro 1K", desc: "Nano 图像生成服务（专业版 1K 分辨率）", normal: 28, vip: 28 },
  { name: "Nano Banana Pro 2K", desc: "Nano 图像生成服务（专业版 2K 分辨率）", normal: 28, vip: 28 },
  { name: "Nano Banana Pro 4K", desc: "Nano 图像生成服务（专业版 4K 分辨率）", normal: 28, vip: 28 },
  { name: "Nano Banana 2", desc: "Nano 图像生成服务（Banana 2）", normal: 20, vip: 20 },
  { name: "GPT-Image 高清", desc: "GPT-Image 图像生成（高清版）", normal: 24, vip: 16 },
  { name: "Suno V4", desc: "Suno 音乐生成服务（完整曲目）", normal: 60, vip: 40 },
  { name: "智能对话 · GPT-5", desc: "GPT-5 高级推理对话（每千 tokens）", normal: 8, vip: 5 },
]

function BadgeTag({ tone, children }: { tone?: "primary" | "accent" | "orange"; children: React.ReactNode }) {
  const toneClass =
    tone === "primary"
      ? "bg-primary text-primary-foreground"
      : tone === "accent"
        ? "bg-accent text-accent-foreground"
        : "bg-orange-500 text-white"
  return (
    <span
      className={cn(
        "absolute -top-px right-4 inline-flex items-center rounded-b-md px-2 py-1 text-[10px] font-semibold",
        toneClass,
      )}
    >
      {children}
    </span>
  )
}

export function MembershipDialog({
  open,
  onOpenChange,
  defaultTab = "membership",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: "membership" | "points"
}) {
  const [tab, setTab] = React.useState<"membership" | "points">(defaultTab)
  const [pointsOpen, setPointsOpen] = React.useState(false)

  React.useEffect(() => {
    if (open) setTab(defaultTab)
  }, [open, defaultTab])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="w-[calc(100vw-1.5rem)] max-w-5xl gap-0 overflow-hidden border-border/70 bg-card p-0 sm:w-[calc(100vw-2rem)] sm:max-w-5xl"
        >
          <div className="relative max-h-[90vh] overflow-y-auto p-5 sm:p-8">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5" />
            <button
              onClick={() => onOpenChange(false)}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground sm:right-5 sm:top-5"
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative">
              <DialogTitle className="pr-10 text-2xl font-bold tracking-tight text-primary sm:text-3xl">
                让创意灵感即刻成片
              </DialogTitle>
              <DialogDescription className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
                选择合适的套餐，会员用户创作享受点数优惠折扣
              </DialogDescription>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 sm:mt-6">
                <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-background/50 p-1 sm:gap-2">
                  <button
                    onClick={() => setTab("membership")}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:px-4",
                      tab === "membership"
                        ? "bg-primary/15 text-primary ring-1 ring-primary/40"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    会员套餐
                  </button>
                  <button
                    onClick={() => setTab("points")}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:px-4",
                      tab === "points"
                        ? "bg-primary/15 text-primary ring-1 ring-primary/40"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <ArrowUpCircle className="h-3.5 w-3.5" />
                    点数套餐
                  </button>
                </div>

                <button
                  onClick={() => setPointsOpen(true)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Info className="h-3.5 w-3.5" />
                  点数消耗说明
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:mt-6 md:grid-cols-2 lg:grid-cols-3">
                {tab === "membership"
                  ? MEMBERSHIP_PLANS.map((plan) => (
                      <article
                        key={plan.id}
                        className={cn(
                          "relative flex flex-col rounded-2xl border bg-background/60 p-5 transition-all sm:p-6",
                          plan.recommended
                            ? "border-primary/60 shadow-xl shadow-primary/10"
                            : "border-border hover:border-primary/40",
                        )}
                      >
                        {plan.badge && <BadgeTag tone={plan.badgeTone}>{plan.badge}</BadgeTag>}

                        <header className="flex items-center gap-2">
                          <h3 className="text-xl font-bold">{plan.name}</h3>
                          {plan.recommended && (
                            <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-500">
                              <Sparkles className="h-3 w-3" />
                              Recommended
                            </span>
                          )}
                        </header>

                        <div className="mt-3 flex items-baseline gap-2">
                          <span className="text-sm font-medium text-foreground">¥</span>
                          <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                          <span className="text-sm text-muted-foreground line-through">¥{plan.originalPrice}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {plan.perDay}，立省 {plan.save} 元
                        </p>

                        <p className="mt-5 text-sm font-semibold text-primary">
                          赠送 <span className="tabular-nums">{plan.bonusPoints.toLocaleString()}</span> 点数，点数永久有效
                        </p>

                        <ul className="mt-3 flex-1 space-y-2 text-sm">
                          {plan.features.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-muted-foreground">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                              <span className="break-words leading-relaxed">{f}</span>
                            </li>
                          ))}
                        </ul>

                        <Button
                          size="lg"
                          className={cn(
                            "mt-6 w-full rounded-full font-semibold",
                            plan.recommended
                              ? "bg-primary text-primary-foreground hover:bg-primary/90"
                              : "bg-primary/90 text-primary-foreground hover:bg-primary",
                          )}
                        >
                          {plan.recommended && <Crown className="mr-1 h-4 w-4" />}
                          购买
                        </Button>
                      </article>
                    ))
                  : POINTS_PACKAGES.map((pkg) => (
                      <article
                        key={pkg.id}
                        className="relative flex flex-col rounded-2xl border border-border bg-background/60 p-5 transition-all hover:border-primary/40 sm:p-6"
                      >
                        {pkg.badge && <BadgeTag tone="accent">{pkg.badge}</BadgeTag>}

                        <h3 className="text-xl font-bold tabular-nums">
                          {pkg.points.toLocaleString()} 点
                        </h3>

                        <div className="mt-3 flex items-baseline gap-2">
                          <span className="text-sm font-medium text-foreground">¥</span>
                          <span className="text-4xl font-bold tracking-tight">{pkg.price}</span>
                          <span className="text-sm text-muted-foreground line-through">¥{pkg.originalPrice}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {pkg.perHundred}，立省 {pkg.save} 元
                        </p>

                        <p className="mt-5 text-sm font-semibold text-primary">
                          含 <span className="tabular-nums">{pkg.totalPoints.toLocaleString()}</span> 点数，点数永久有效
                        </p>

                        <ul className="mt-3 flex-1 space-y-2 text-sm">
                          {pkg.features.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-muted-foreground">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                              <span className="break-words leading-relaxed">{f}</span>
                            </li>
                          ))}
                        </ul>

                        <Button
                          size="lg"
                          className="mt-6 w-full rounded-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                        >
                          购买
                        </Button>
                      </article>
                    ))}
              </div>

              <div className="mt-6 flex flex-col items-center gap-2 border-t border-border/60 pt-5 text-xs text-muted-foreground sm:flex-row sm:justify-between">
                <p className="flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-accent" fill="currentColor" />
                  支付宝 · 微信 · 银联 · ���公转账 · 可开增值税发票
                </p>
                <p>购买即视为同意《服务条款》和《会员协议》</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={pointsOpen} onOpenChange={setPointsOpen}>
        <DialogContent
          showCloseButton={false}
          className="w-[calc(100vw-1.5rem)] max-w-3xl gap-0 overflow-hidden p-0 sm:w-[calc(100vw-2rem)] sm:max-w-3xl"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6 sm:py-4">
            <DialogTitle className="text-base font-semibold sm:text-lg">点数说明</DialogTitle>
            <button
              onClick={() => setPointsOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <DialogDescription className="sr-only">所有 AI 产品的点数消耗说明，VIP 会员享受折扣价</DialogDescription>

          <div className="max-h-[70vh] overflow-y-auto">
            <div className="bg-primary/5 px-4 py-3 text-xs font-medium text-primary sm:px-6 sm:text-sm">
              VIP 会员期间享受以下产品点数折扣
            </div>

            <div className="px-4 pb-6 sm:px-6">
              <div className="sticky top-0 z-10 grid grid-cols-[1fr_60px_60px] items-center gap-3 border-b border-border bg-card py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid-cols-[1fr_90px_90px] sm:gap-4 sm:text-xs">
                <span>名称</span>
                <span className="text-right tabular-nums">普通</span>
                <span className="text-right tabular-nums">VIP</span>
              </div>
              <ul>
                {POINT_COSTS.map((item) => (
                  <li
                    key={item.name}
                    className="grid grid-cols-[1fr_60px_60px] items-center gap-3 border-b border-border/60 py-3 last:border-b-0 sm:grid-cols-[1fr_90px_90px] sm:gap-4 sm:py-3.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-primary/90 sm:truncate">{item.desc}</p>
                    </div>
                    <span className="text-right text-sm tabular-nums">{item.normal}</span>
                    <span className="text-right text-sm font-semibold tabular-nums text-primary">{item.vip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
