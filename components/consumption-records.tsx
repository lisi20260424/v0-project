"use client"

import useSWR from "swr"
import { platformAPI } from "@/lib/platform-api"

type ConsumptionRecord = { id: string; type?: string; tool_label?: string; cost?: number; status?: string; created_at?: string }

type ConsumptionResponse = { data?: ConsumptionRecord[] }

async function fetcher(): Promise<ConsumptionResponse> {
  const token = localStorage.getItem("accessToken") ?? ""
  if (!token) throw new Error("请先登录后再试")
  return platformAPI.userConsumption(token)
}

export function ConsumptionRecords() {
  const { data, error, isLoading } = useSWR<ConsumptionResponse>("consumption-records", fetcher)
  const records = data?.data ?? []
  if (isLoading) return <div className="rounded-xl border border-border bg-card p-8 text-sm text-muted-foreground">消费记录加载中...</div>
  if (error) return <div className="rounded-xl border border-border bg-card p-8 text-sm text-muted-foreground">{error instanceof Error ? error.message : "消费记录加载失败"}</div>
  if (!records.length) return <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">暂无消费记录</div>
  return <div className="rounded-xl border border-border bg-card">{records.map((record) => <div key={record.id} className="flex items-center justify-between border-b border-border p-4 last:border-b-0"><span>{record.tool_label || record.type || "消费"}</span><span>{record.cost ?? 0} 点</span></div>)}</div>
}
