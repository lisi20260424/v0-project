"use client"

import { Button } from "@/components/ui/button"

export function OAuthButtons({ redirectTo: _redirectTo }: { redirectTo?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Button type="button" variant="outline" className="h-10 w-full bg-transparent" disabled>
        Google 登录暂未开放
      </Button>
    </div>
  )
}
