import { Film, ImageIcon, Music2, MessageSquare } from "lucide-react"

const SECTIONS = [
  {
    icon: Film,
    title: "视频模型",
    items: [
      { name: "Veo 3.1 Fast", unit: "每条", regular: 30, member: 23 },
      { name: "Veo 3.1 Fast 4K", unit: "每条", regular: 40, member: 30 },
      { name: "Veo 3.1 Pro", unit: "每条", regular: 80, member: 60 },
      { name: "Sora 2", unit: "每条", regular: 50, member: 38 },
      { name: "Sora 2 Pro", unit: "每条", regular: 120, member: 90 },
      { name: "可灵 标准 / Pro / 大师", unit: "每条", regular: "20 ~ 70", member: "15 ~ 53" },
    ],
  },
  {
    icon: ImageIcon,
    title: "图像模型",
    items: [
      { name: "GPT-Image 2", unit: "每张", regular: 4, member: 3 },
      { name: "Nano Banana", unit: "每张", regular: 5, member: 4 },
      { name: "Flux 1.1", unit: "每张", regular: 3, member: 2 },
      { name: "超清 4K 附加", unit: "每张", regular: 2, member: 1.5 },
    ],
  },
  {
    icon: Music2,
    title: "音乐模型",
    items: [
      { name: "Suno V4", unit: "每次 2 首", regular: 10, member: 8 },
      { name: "Suno V5", unit: "每次 2 首", regular: 16, member: 12 },
    ],
  },
  {
    icon: MessageSquare,
    title: "对话模型",
    items: [
      { name: "GPT-5", unit: "千字", regular: 0.15, member: 0.11 },
      { name: "GPT-5 Mini", unit: "千字", regular: 0.03, member: 0.025 },
      { name: "Claude Opus 4.6", unit: "千字", regular: 0.12, member: 0.09 },
      { name: "Gemini 3 Flash", unit: "千字", regular: 0.05, member: 0.04 },
      { name: "DeepSeek V3", unit: "千字", regular: 0.02, member: 0.015 },
    ],
  },
]

export function PricingTable() {
  return (
    <section className="border-b border-border/60">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">详细价目表</h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            所有价格单位：点。1 元 = 10 点起。会员价自动按 7.5 折结算。
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {SECTIONS.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.title} className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-5 py-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold">{s.title}</h3>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="px-5 py-2 text-left font-medium">模型</th>
                      <th className="px-2 py-2 text-left font-medium">单位</th>
                      <th className="px-2 py-2 text-right font-medium">普通价</th>
                      <th className="px-5 py-2 text-right font-medium">会员价</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.items.map((it, i) => (
                      <tr key={it.name} className={i % 2 === 1 ? "bg-muted/30" : ""}>
                        <td className="px-5 py-2.5 font-medium">{it.name}</td>
                        <td className="px-2 py-2.5 text-xs text-muted-foreground">{it.unit}</td>
                        <td className="px-2 py-2.5 text-right tabular-nums text-muted-foreground">{it.regular}</td>
                        <td className="px-5 py-2.5 text-right tabular-nums font-medium text-primary">{it.member}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
