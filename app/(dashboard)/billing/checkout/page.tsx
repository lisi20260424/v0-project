import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { findPlan, type PlanKind } from "@/lib/payment/plans"
import { CheckoutClient } from "@/components/billing/checkout-client"

export const dynamic = "force-dynamic"

type SearchParams = Promise<{
  kind?: string
  code?: string
}>

export default async function CheckoutPage({ searchParams }: { searchParams: SearchParams }) {
  const { kind, code } = await searchParams

  // 校验登录
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(`/billing/checkout?kind=${kind ?? ""}&code=${code ?? ""}`)}`)
  }

  // 校验套餐
  const planKind = kind as PlanKind | undefined
  if (!planKind || (planKind !== "membership" && planKind !== "points") || !code) {
    redirect("/billing")
  }
  const plan = findPlan(planKind, code)
  if (!plan) {
    redirect("/billing")
  }

  const planName = "name" in plan ? plan.name : `${plan.totalPoints.toLocaleString()} 点套餐`
  const bonusPoints =
    planKind === "membership"
      ? (plan as { bonusPoints: number }).bonusPoints
      : (plan as { totalPoints: number }).totalPoints

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <Link
        href="/billing"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        返回订阅与账单
      </Link>

      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight">扫码支付</h1>
        <p className="text-sm text-muted-foreground">使用微信或支付宝扫描二维码完成支付</p>
      </header>

      <CheckoutClient
        planKind={planKind}
        planCode={code}
        planName={planName}
        amount={plan.price}
        originalPrice={plan.originalPrice}
        bonusPoints={bonusPoints}
        features={plan.features}
      />
    </div>
  )
}
