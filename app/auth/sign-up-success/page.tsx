import Link from "next/link"
import { Mail } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "注册成功 · 灵境 AI",
}

export default function SignUpSuccessPage() {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Mail className="h-7 w-7" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">请查收你的邮箱</h1>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          我们已发送了一封验证邮件，请点击邮件中的链接完成账号激活，即可立即开始创作。
          <br />
          <span className="text-xs">没有收到？请检查垃圾邮件文件夹。</span>
        </p>
      </div>
      <Button asChild className="w-full">
        <Link href="/auth/login">返回登录</Link>
      </Button>
    </div>
  )
}
