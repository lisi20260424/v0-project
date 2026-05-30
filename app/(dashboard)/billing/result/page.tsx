import Link from "next/link"
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

type SearchParams = Promise<{ orderId?: string; status?: string }>

export default async function PaymentResultPage({ searchParams }: { searchParams: SearchParams }) {
  const { orderId, status } = await searchParams
  const isSuccess = status === "success"

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12">
      <Link href="/billing" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />返回订阅与账单</Link>
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-card p-10 text-center">
        {isSuccess ? <CheckCircle2 className="h-16 w-16 text-primary" /> : <XCircle className="h-16 w-16 text-muted-foreground" />}
        <div><h1 className="text-2xl font-bold">{isSuccess ? "支付成功" : "支付未完成"}</h1><p className="mt-2 text-sm text-muted-foreground">{orderId ? `订单号：${orderId}` : "暂无订单号"}</p></div>
        <div className="flex gap-3"><Button asChild><Link href="/billing">查看订阅</Link></Button><Button asChild variant="outline"><Link href="/dashboard">返回工作台</Link></Button></div>
      </div>
    </div>
  )
}
