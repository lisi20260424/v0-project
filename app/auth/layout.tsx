import Link from "next/link"
import Image from "next/image"
import { Zap } from "lucide-react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-svh w-full lg:grid-cols-2">
      {/* 左侧品牌展示 */}
      <div className="relative hidden overflow-hidden bg-secondary lg:flex lg:flex-col">
        <Image
          src="/showcase/clay-girl.jpg"
          alt=""
          fill
          sizes="50vw"
          priority
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/60 to-background/30" />

        <div className="relative z-10 flex h-full flex-col justify-between p-10">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground">
              <Zap className="h-5 w-5" fill="currentColor" />
            </span>
            <div className="leading-tight">
              <p className="text-lg font-bold">灵境 AI</p>
              <p className="text-[11px] text-muted-foreground">多模态创作平台</p>
            </div>
          </Link>

          <div className="max-w-md">
            <h2 className="text-pretty text-3xl font-bold leading-tight">
              让创意灵感，<span className="text-primary">即刻成片</span>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              聚合 Veo 3、Sora 2、可灵、Nano Banana、GPT-Image、Suno 等全球顶尖 AI 模型，
              一个账号，畅享视频、图像、音乐、对话全部创作能力。
            </p>

            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                注册即送 100 点，立即开始创作
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                企业级稳定接口，作品永久云端保存
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                会员专享折扣，最高省 60%
              </li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground">© 2026 灵境 AI · 让 AI 成为你的灵感画笔</p>
        </div>
      </div>

      {/* 右侧表单 */}
      <div className="flex flex-col">
        <header className="flex items-center justify-between p-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent text-primary-foreground">
              <Zap className="h-4 w-4" fill="currentColor" />
            </span>
            <span className="text-base font-bold">灵境 AI</span>
          </Link>
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
            返回首页
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-sm">{children}</div>
        </main>
      </div>
    </div>
  )
}
