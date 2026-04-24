import { Type, ImageIcon, Zap, Layers, Globe2, ShieldCheck } from "lucide-react"

const FEATURES = [
  {
    icon: Type,
    title: "文生视频",
    desc: "输入一句描述，即可生成电影级镜头。支持 5000 字超长 Prompt，精准控制镜头、光线、情绪。",
  },
  {
    icon: ImageIcon,
    title: "图生视频",
    desc: "上传一张静态图片，AI 自动理解画面，生成自然流畅的动态视频，让你的图片动起来。",
  },
  {
    icon: Zap,
    title: "极速生成",
    desc: "GPU 集群加速，平均 45 秒完成一段 8 秒视频。会员优先排队，高峰期也无需等待。",
  },
  {
    icon: Layers,
    title: "多模型支持",
    desc: "集成 Veo 3.1 Fast、4K、Pro 三大版本，适配不同场景。灵活选择速度、画质与成本。",
  },
  {
    icon: Globe2,
    title: "原生中文",
    desc: "专为中文创作者优化，精准理解成语、网络用语、古诗词等本土表达，无需翻译。",
  },
  {
    icon: ShieldCheck,
    title: "内容合规",
    desc: "全链路内容安全审核，符合国内监管要求。企业用户可申请私有化部署与数据隔离。",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="border-b border-border/60 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">为什么选择 VeoCraft</h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            一站式 AI 视频创作平台，从想法到成片，只需几步操作。
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
