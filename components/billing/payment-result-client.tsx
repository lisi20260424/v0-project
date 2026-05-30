"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Sparkles, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { platformAuthFetch } from "@/lib/platform-session"

type Order = {
  id: string
  plan_name: string
  plan_kind: string
  amount: number
  bonus_points: number
  status: string
  paid_at?: string | null
  payment_method?: string | null
}

export function PaymentResultClient({ orderId, status }: { orderId?: string; status?: string }) {
  const [order, setOrder] = React.useState<Order | null>(null)

  React.useEffect(() => {
    if (!orderId) return
    platformAuthFetch(`/v1/pay/orders/${orderId}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setOrder(json?.data ?? json?.order ?? null))
      .catch(() => {})
  }, [orderId])

  const isSuccess = (status === "success" || order?.status === "paid") && !!order

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12">
      <Link href="/billing" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        返回订阅与账单
      </Link>

      <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-card p-10 text-center">
        {isSuccess ? (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-bold">支付成功</h1>
              <p className="text-sm text-muted-foreground">
                您已成功购买 <span className="font-medium text-foreground">{order?.plan_name}</span>
              </p>
            </div>
            <dl className="grid w-full max-w-sm gap-3 rounded-xl border border-border/60 bg-background/40 p-4 text-left text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">订单类型</dt>
                <dd>{order?.plan_kind === "membership" ? "会员订阅" : "点数充值"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">支付金额</dt>
                <dd className="font-semibold tabular-nums">¥{order?.amount}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">支付方式</dt>
                <dd>{order?.payment_method === "wechat" ? "微信支付" : order?.payment_method === "alipay" ? "支付宝" : "-"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">{order?.plan_kind === "membership" ? "赠送点数" : "到账点数"}</dt>
                <dd className="flex items-center gap-1 font-semibold text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  {Number(order?.bonus_points ?? 0).toLocaleString()} 点
                </dd>
              </div>
            </dl>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild><Link href="/billing">查看订阅记录</Link></Button>
              <Button asChild variant="outline"><Link href="/dashboard">返回控制台</Link></Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <XCircle className="h-9 w-9" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-bold">支付未完成</h1>
              <p className="text-sm text-muted-foreground">未查询到已完成的支付记录</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild><Link href="/billing">重新选择套餐</Link></Button>
              <Button asChild variant="outline"><Link href="/billing/records">查看账单记录</Link></Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
