import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { findPlan, type PlanKind } from "@/lib/payment/plans"
import { CheckoutClient } from "@/components/billing/checkout-client"

export const dynamic = "force-dynamic"

type SearchParams = Promise<{ kind?: string; code?: string }>

export default async function CheckoutPage({ searchParams }: { searchParams: SearchParams }) {
  const { kind, code } = await searchParams
  const planKind = kind as PlanKind | undefined
  const plan = planKind && code ? findPlan(planKind, code) : null

  if (!planKind || !code || !plan || (planKind !== "membership" && planKind !== "points")) {
    return <div className="mx-auto max-w-4xl px-4 py-8 text-sm text-muted-foreground">套餐参数无效，请返回重新选择。</div>
  }

  const planName = "name" in plan ? plan.name : `${plan.totalPoints.toLocaleString()} 点套餐`
  const bonusPoints = planKind === "membership" ? (plan as { bonusPoints: number }).bonusPoints : (plan as { totalPoints: number }).totalPoints

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <Link href="/billing" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />返回订阅记录</Link>
      <header><h1 className="text-2xl font-bold tracking-tight">扫码支付</h1><p className="mt-1 text-sm text-muted-foreground">支付能力已切换到 Go 后端接口。</p></header>
      <CheckoutClient planKind={planKind} planCode={code} planName={planName} amount={plan.price} originalPrice={plan.originalPrice} bonusPoints={bonusPoints} features={plan.features} />
    </div>
  )
}
