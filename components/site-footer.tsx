import Link from "next/link"

const GROUPS = [
  {
    title: "视频生成",
    links: [
      { label: "Veo 3.1", href: "/veo" },
      { label: "Sora 2", href: "/sora" },
      { label: "可灵 2.0", href: "/kling" },
      { label: "作品广场", href: "/gallery" },
    ],
  },
  {
    title: "图像 & 音乐",
    links: [
      { label: "GPT-Image 2", href: "/image" },
      { label: "Nano Banana", href: "/image?model=nano-banana" },
      { label: "Flux 图像", href: "/image?model=flux" },
      { label: "Suno 音乐", href: "/suno" },
    ],
  },
  {
    title: "公司",
    links: [
      { label: "关于灵境", href: "#" },
      { label: "团队博客", href: "#" },
      { label: "加入我们", href: "#" },
      { label: "合作商务", href: "#" },
    ],
  },
  {
    title: "支持",
    links: [
      { label: "帮助中心", href: "#" },
      { label: "API 文档", href: "#" },
      { label: "服务状态", href: "#" },
      { label: "服务条款", href: "#" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid gap-10 md:grid-cols-6">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground">
                <span className="text-sm font-bold">灵</span>
              </div>
              <span className="font-semibold">灵境 AI</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              国内直连的多模态 AI 聚合平台。视频、图像、音乐、对话，一个账号，统一点数，畅享全球顶级模型。
            </p>
            <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="rounded border border-border bg-background px-2 py-1">ICP 备 2026000001 号</span>
              <span className="rounded border border-border bg-background px-2 py-1">公安备 000001 号</span>
            </div>
          </div>

          {GROUPS.map((g) => (
            <div key={g.title}>
              <h4 className="text-sm font-semibold">{g.title}</h4>
              <ul className="mt-3 space-y-2">
                {g.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <span>© 2026 灵境 AI Studio. All rights reserved.</span>
          <span>内容由 AI 生成，请遵守平台内容规范</span>
        </div>
      </div>
    </footer>
  )
}
