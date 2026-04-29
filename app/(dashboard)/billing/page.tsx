import { SubscriptionRecords } from "@/components/billing/subscription-records"

export const metadata = {
  title: "订阅记录 · 灵境 AI",
  description: "查看您的会员订阅与点数包订单",
}

export const dynamic = "force-dynamic"

export default function SubscriptionsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">订阅记录</h1>
        <p className="text-muted-foreground">查看您的会员订阅与点数包购买记录</p>
      </div>

      <SubscriptionRecords />
    </div>
  )
}
