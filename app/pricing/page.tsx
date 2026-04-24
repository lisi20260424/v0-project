import type { Metadata } from "next"
import { AnnouncementBar } from "@/components/announcement-bar"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { PricingSection } from "@/components/pricing-section"
import { PointsPackages } from "@/components/points-packages"
import { PricingFaq } from "@/components/pricing-faq"
import { PricingTable } from "@/components/pricing-table"

export const metadata: Metadata = {
  title: "定价方案 · 灵境 AI",
  description: "灵境 AI 提供免费版、专业版、企业版订阅，以及按需点数包，随时充值，按实际使用量扣费。",
}

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <SiteHeader />

      <section className="relative border-b border-border/60 bg-muted/30">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-20 [mask-image:radial-gradient(ellipse_at_top,black_10%,transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 text-center md:px-6 md:py-16">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            无隐藏费用 · 随时升降级
          </span>
          <h1 className="mt-5 text-balance text-3xl font-semibold tracking-tight md:text-5xl">
            一个价格，解锁所有 AI 模型
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm text-muted-foreground md:text-base">
            订阅会员享全模型 75 折，或购买点数包按需使用。企业用户可申请定制方案与私有化部署。
          </p>
        </div>
      </section>

      <main className="flex-1">
        <PricingSection />
        <PointsPackages />
        <PricingTable />
        <PricingFaq />
      </main>

      <SiteFooter />
    </div>
  )
}
