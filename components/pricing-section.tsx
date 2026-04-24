import { Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const PLANS = [
  {
    id: "free",
    name: "免费版",
    price: "0",
    unit: "元",
    desc: "适合初次体验 AI 视频创作的用户",
    features: ["每日赠送 20 点数", "支持 Veo 3.1 Fast", "最多 3 条排队任务", "作品带有水印", "社区支持"],
    cta: "免费开始",
    highlight: false,
  },
  {
    id: "pro",
    name: "专业版",
    price: "99",
    unit: "元 / 月",
    desc: "创作者首选 · 性价比之王",
    features: [
      "每月 3,000 点数",
      "全部模型不限量使用",
      "4K 超清输出",
      "作品无水印",
      "优先排队 + 加速生成",
      "邮件客服支持",
    ],
    cta: "立即升级",
    highlight: true,
  },
  {
    id: "enterprise",
    name: "企业版",
    price: "定制",
    unit: "",
    desc: "团队协作与 API 集成",
    features: [
      "不限点数 · 按需计费",
      "API / Webhook 接入",
      "专属客户成功经理",
      "私有化部署可选",
      "SLA 保障 99.9%",
      "数据隔离与审计日志",
    ],
    cta: "联系销售",
    highlight: false,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="border-b border-border/60">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">简单透明的定价</h2>
          <p className="mt-3 text-pretty text-muted-foreground">选择适合你的方案，随时升级或取消，无隐藏费用。</p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm",
                plan.highlight ? "border-primary shadow-primary/5" : "border-border",
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  <Sparkles className="h-3 w-3" />
                  最受欢迎
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.desc}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  {plan.price !== "定制" && <span className="text-sm text-muted-foreground">¥</span>}
                  <span className="text-4xl font-semibold tracking-tight">{plan.price}</span>
                  {plan.unit && <span className="text-sm text-muted-foreground">{plan.unit}</span>}
                </div>
              </div>

              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check
                      className={cn("mt-0.5 h-4 w-4 flex-shrink-0", plan.highlight ? "text-primary" : "text-primary/80")}
                    />
                    <span className="text-foreground/80">{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={cn("mt-6 w-full", plan.highlight ? "" : "bg-secondary text-secondary-foreground hover:bg-secondary/80")}
                variant={plan.highlight ? "default" : "secondary"}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          所有方案均支持 7 天内无理由退款 · 支持支付宝 / 微信 / 对公转账
        </p>
      </div>
    </section>
  )
}
