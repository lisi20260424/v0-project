import Link from "next/link"
import { Sparkles } from "lucide-react"

const GROUPS = [
  {
    title: "产品",
    links: [
      { label: "文生视频", href: "#generator" },
      { label: "图生视频", href: "#generator" },
      { label: "作品广场", href: "#gallery" },
      { label: "API 文档", href: "#docs" },
    ],
  },
  {
    title: "公司",
    links: [
      { label: "关于我们", href: "#" },
      { label: "团队博客", href: "#" },
      { label: "加入我们", href: "#" },
      { label: "联系我们", href: "#" },
    ],
  },
  {
    title: "支持",
    links: [
      { label: "帮助中心", href: "#" },
      { label: "使用教程", href: "#" },
      { label: "服务状态", href: "#" },
      { label: "提交反馈", href: "#" },
    ],
  },
  {
    title: "法律",
    links: [
      { label: "服务条款", href: "#" },
      { label: "隐私政策", href: "#" },
      { label: "内容规范", href: "#" },
      { label: "Cookie 声明", href: "#" },
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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-semibold">VeoCraft</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              VeoCraft 是基于 Veo 3.1 模型的 AI 视频生成 SaaS 平台， 让每个人都能轻松创作电影级视频内容。
            </p>
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
          <span>© 2026 VeoCraft Studio. All rights reserved.</span>
          <span>内容由 AI 生成，请遵守平台内容规范</span>
        </div>
      </div>
    </footer>
  )
}
