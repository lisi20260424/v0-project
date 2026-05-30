"use client"

import useSWR from "swr"
import { platformAPI } from "@/lib/platform-api"

type BillingRecord = { id: string; description?: string; points?: number; amount?: number; created_at?: string }

type BillingResponse = { data?: BillingRecord[]; total?: number }

async function fetcher(): Promise<BillingResponse> {
  const token = localStorage.getItem("accessToken") ?? ""
  if (!token) throw new Error("请先登录后再试")
  return platformAPI.listBilling(token, "")
}

export function BillingRecords() {
  const { data, error, isLoading } = useSWR<BillingResponse>("billing-records", fetcher)
  const records = data?.data ?? []

  if (isLoading) return <div className="rounded-xl border border-border bg-card p-8 text-sm text-muted-foreground">账单加载中...</div>
  if (error) return <div className="rounded-xl border border-border bg-card p-8 text-sm text-muted-foreground">{error instanceof Error ? error.message : "账单加载失败"}</div>
  if (!records.length) return <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">暂无账单记录</div>

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {records.map((record) => (
        <div key={record.id} className="flex items-center justify-between border-b border-border p-4 last:border-b-0">
          <div><div className="text-sm font-medium">{record.description || "账单记录"}</div><div className="text-xs text-muted-foreground">{record.created_at || "-"}</div></div>
          <div className="text-sm font-semibold">{record.points ?? record.amount ?? 0}</div>
        </div>
      ))}
    </div>
  )
}
