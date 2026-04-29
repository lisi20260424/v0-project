"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useUser } from "@/components/user-provider"
import { Spinner } from "@/components/ui/spinner"

/**
 * 认证守卫组件：在登录后正确处理重定向和用户状态更新
 * 用于包装登录表单，在认证成功后确保用户状态已加载再进行重定向
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useUser()
  const next = searchParams.get("next") ?? "/dashboard"

  useEffect(() => {
    // 如果用户已登录且 loading 已完成，跳转到目标页面
    if (user && !loading) {
      console.log("[v0] AuthGuard: 用户已登录，跳转到", next)
      router.push(next)
      router.refresh()
    }
  }, [user, loading, next, router])

  // 如果用户已登录，显示加载状态
  if (user && loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  // 返回登录表单或其他内容
  return children
}
