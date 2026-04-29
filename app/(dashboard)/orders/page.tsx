import { Suspense } from "react"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { ConsumptionRecords } from "@/components/consumption-records"

export const metadata = {
  title: "消费记录 · 灵境 AI",
  description: "查看您的消费记录和点数使用情况",
}

export const dynamic = "force-dynamic"

export default function OrdersPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 py-8 px-4 sm:px-6">
      {/* 页面头 */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">消费记录</h1>
        <p className="text-muted-foreground">查看您的所有消费记录和点数使用情况</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/billing"
          className="group rounded-lg border border-border bg-card p-4 hover:border-primary/50 hover:shadow-sm transition-all"
        >
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-muted-foreground">订阅与账单</h3>
            <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              查看您的订阅计划和账单信息 →
            </p>
          </div>
        </Link>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-muted-foreground">点数用途</h3>
            <p className="text-xs text-muted-foreground">点数用于生成各类内容</p>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="group rounded-lg border border-border bg-card p-4 hover:border-primary/50 hover:shadow-sm transition-all"
        >
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-muted-foreground">我的任务</h3>
            <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              查看正在进行的生成任务 →
            </p>
          </div>
        </Link>
      </div>

      {/* 消费记录表格 */}
      <Suspense fallback={<div className="h-96 rounded-lg border border-border bg-card" />}>
        <ConsumptionRecords />
      </Suspense>
    </div>
  )
}
