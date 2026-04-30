import { BillingRecords } from "@/components/billing/billing-records"

export const metadata = {
  title: "账单记录 · 灵境 AI",
  description: "查看您的点数账单流水",
}

export const dynamic = "force-dynamic"

export default function BillingRecordsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">账单记录</h1>
        <p className="text-muted-foreground">查看您的所有点数账单流水（充值、消费、赠送、退款）</p>
      </div>

      <BillingRecords />
    </div>
  )
}
