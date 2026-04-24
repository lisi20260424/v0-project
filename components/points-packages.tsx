import { Zap, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const PACKAGES = [
  { id: "p1", points: 100, price: 10, bonus: 0, perPoint: "0.100" },
  { id: "p2", points: 500, price: 45, bonus: 50, perPoint: "0.082", tag: "加赠 50 点" },
  { id: "p3", points: 1000, price: 85, bonus: 150, perPoint: "0.074", tag: "超值", highlight: true },
  { id: "p4", points: 3000, price: 240, bonus: 600, perPoint: "0.067", tag: "加赠 600 点" },
  { id: "p5", points: 10000, price: 750, bonus: 2500, perPoint: "0.060", tag: "企业推荐" },
]

export function PointsPackages() {
  return (
    <section className="border-b border-border/60 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">按需点数包</h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            不想订阅？直接购买点数，永不过期，所有模型通用。充值越多，单价越低。
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {PACKAGES.map((p) => (
            <div
              key={p.id}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-5 transition-all",
                p.highlight
                  ? "border-primary shadow-lg shadow-primary/5"
                  : "border-border hover:border-primary/40",
              )}
            >
              {p.tag && (
                <span
                  className={cn(
                    "absolute -top-2.5 left-5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                    p.highlight ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground",
                  )}
                >
                  <Gift className="h-3 w-3" />
                  {p.tag}
                </span>
              )}
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-semibold tabular-nums">{p.points.toLocaleString()}</span>
                <Zap className="h-4 w-4 text-accent" fill="currentColor" />
              </div>
              {p.bonus > 0 && (
                <span className="mt-1 text-xs text-primary">+{p.bonus} 点赠送</span>
              )}
              <div className="mt-4 flex items-baseline gap-1 border-t border-border pt-4">
                <span className="text-sm text-muted-foreground">¥</span>
                <span className="text-2xl font-semibold tabular-nums">{p.price}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                折合 ¥{p.perPoint} / 点
              </p>
              <Button size="sm" className="mt-4 w-full" variant={p.highlight ? "default" : "secondary"}>
                立即充值
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          点数永久有效 · 支持支付宝 / 微信 / 银联 / 对公转账 · 可开具增值税普通或专用发票
        </p>
      </div>
    </section>
  )
}
