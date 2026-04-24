import { Layers, Zap, Globe2, ShieldCheck, Coins, Code2 } from "lucide-react"

const FEATURES = [
  {
    icon: Layers,
    title: "20+ 顶级模型",
    desc: "Veo 3.1、Sora 2、可灵 2.0、GPT-Image、Nano Banana、Suno V5…… 全球主流模型一次集齐，持续更新。",
  },
  {
    icon: Coins,
    title: "统一点数计费",
    desc: "一套点数畅通所有模型，无需为每个平台单独充值。按实际消耗扣费，用多少付多少。",
  },
  {
    icon: Zap,
    title: "极速国内直连",
    desc: "国内节点中转加速，免翻墙直接调用海外模型。平均响应 30 秒，高峰期优先级保障。",
  },
  {
    icon: Globe2,
    title: "原生中文优化",
    desc: "针对中文指令、成语、古诗词、网络语进行指令优化。生成结果更懂中文语境与审美。",
  },
  {
    icon: Code2,
    title: "开放 API",
    desc: "提供标准 REST API 与 Webhook，兼容 OpenAI SDK 调用格式，轻松接入自有产品。",
  },
  {
    icon: ShieldCheck,
    title: "合规与安全",
    desc: "全链路内容安全审核，通过等保三级。企业可申请私有部署、数据隔离与审计日志。",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="border-b border-border/60">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">为什么选择灵境 AI</h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            国内可直接使用的多模态 AI 聚合平台，让创作者与开发者专注于灵感本身。
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
