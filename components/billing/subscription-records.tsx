"use client"

import Link from "next/link"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { platformAPI } from "@/lib/platform-api"

type SubscriptionRecord = { id: string; plan_name?: string; status?: string; amount?: number; created_at?: string }

type SubscriptionResponse = { data?: SubscriptionRecord[]; currentVip?: { tier?: string | null; points?: number } }

async function fetcher(): Promise<SubscriptionResponse> {
  const token = localStorage.getItem("accessToken") ?? ""
  if (!token) throw new Error("请先登录后再试")
  return platformAPI.listSubscriptions(token, "")
}

export function SubscriptionRecords() {
  const { data, error, isLoading } = useSWR<SubscriptionResponse>("subscription-records", fetcher)
  const records = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5"><div className="text-sm text-muted-foreground">当前会员</div><div className="mt-2 text-2xl font-bold">{data?.currentVip?.tier || "免费用户"}</div></div>
        <div className="rounded-2xl border border-border bg-card p-5"><div className="text-sm text-muted-foreground">积分余额</div><div className="mt-2 text-2xl font-bold">{data?.currentVip?.points ?? 0}</div></div>
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5"><div className="text-sm font-medium">升级套餐</div><p className="mt-2 text-xs text-muted-foreground">购买会员或积分包。</p><Button asChild size="sm" className="mt-3"><Link href="/pricing">查看套餐</Link></Button></div>
      </div>
      {isLoading ? <div className="rounded-xl border border-border bg-card p-8 text-sm text-muted-foreground">订阅记录加载中...</div> : null}
      {error ? <div className="rounded-xl border border-border bg-card p-8 text-sm text-muted-foreground">{error instanceof Error ? error.message : "订阅记录加载失败"}</div> : null}
      {!isLoading && !error && !records.length ? <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">暂无订阅记录</div> : null}
      {records.length > 0 && <div className="overflow-hidden rounded-xl border border-border bg-card">{records.map((record) => <div key={record.id} className="flex items-center justify-between border-b border-border p-4 last:border-b-0"><div><div className="text-sm font-medium">{record.plan_name || "订阅记录"}</div><div className="text-xs text-muted-foreground">{record.created_at || "-"}</div></div><div className="text-sm font-semibold">{record.status || "pending"}</div></div>)}</div>}
    </div>
  )
}
