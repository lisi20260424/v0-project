import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "认证异常 · 灵境 AI",
}

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15 text-destructive">
        <AlertCircle className="h-7 w-7" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">认证出错了</h1>
        <p className="text-sm text-muted-foreground">
          {params?.error ? `错误信息：${params.error}` : "我们在处理你的登录请求时遇到了问题，请稍后重试。"}
        </p>
      </div>
      <div className="flex w-full flex-col gap-2">
        <Button asChild>
          <Link href="/auth/login">返回登录</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/">返回首页</Link>
        </Button>
      </div>
    </div>
  )
}
