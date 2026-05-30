"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { platformAPI } from "@/lib/platform-api"

type Props = {
  planKind: "membership" | "points"
  planCode: string
  planName: string
  amount: number
  originalPrice?: number
  bonusPoints: number
  features: string[]
}

type OrderResponse = {
  data?: {
    id?: string
    status?: string
    amount?: number
    payment_method?: string
  }
  orderId?: string
}

export function CheckoutClient({ planKind, planCode, planName, amount, originalPrice, bonusPoints, features }: Props) {
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function createOrder() {
    setLoading(true)
    setMessage(null)
    try {
      const token = localStorage.getItem("accessToken") ?? ""
      if (!token) throw new Error("请先登录后再试")
      const data = (await platformAPI.createOrder(token, { planKind, planCode, paymentMethod: "wechat" })) as OrderResponse
      const order = data.data
      setMessage(`订单已创建：${order?.id ?? data.orderId ?? "待确认"}，状态：${order?.status ?? "pending"}`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "创建订单失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">订单详情</h2>
        <dl className="mt-4 grid gap-3 text-sm">
          <div className="flex items-center justify-between border-b border-border/60 pb-3"><dt className="text-muted-foreground">商品</dt><dd className="font-medium">{planName}</dd></div>
          <div className="flex items-center justify-between border-b border-border/60 pb-3"><dt className="text-muted-foreground">类型</dt><dd>{planKind === "membership" ? "会员订阅" : "积分充值"}</dd></div>
          <div className="flex items-center justify-between border-b border-border/60 pb-3"><dt className="text-muted-foreground">到账积分</dt><dd className="font-semibold text-primary">{bonusPoints.toLocaleString()} 点</dd></div>
          <div className="flex items-center justify-between pt-1"><dt className="text-muted-foreground">应付金额</dt><dd className="flex items-baseline gap-2"><span className="text-2xl font-bold">¥{amount}</span>{originalPrice && originalPrice > amount ? <span className="text-sm text-muted-foreground line-through">¥{originalPrice}</span> : null}</dd></div>
        </dl>
        {features.length > 0 && <ul className="mt-5 list-disc space-y-1 pl-4 text-xs text-muted-foreground">{features.slice(0, 4).map((feature) => <li key={feature}>{feature}</li>)}</ul>}
      </section>
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">支付</h2>
        <p className="mt-2 text-sm text-muted-foreground">订单由 Go API 创建并持久化，支付成功后通过支付渠道回调自动入账。</p>
        <Button onClick={createOrder} disabled={loading} className="mt-5 w-full">{loading ? "创建中..." : `创建 ¥${amount} 订单`}</Button>
        {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}
      </section>
    </div>
  )
}
