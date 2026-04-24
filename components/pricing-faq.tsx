import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const FAQS = [
  {
    q: "点数会不会过期？",
    a: "充值获得的点数永久有效，任意时间都可以使用。订阅会员每月赠送的点数随订阅周期一起计算，当月未用完的赠送点数不累计到下月。",
  },
  {
    q: "会员和点数包可以同时使用吗？",
    a: "可以。会员享受全部模型 75 折优惠，同时你额外充值的点数会一起参与结算，扣费按照会员价格执行。",
  },
  {
    q: "如何开具发票？",
    a: "登录后进入「账户设置 - 发票管理」即可自助申请，支持增值税普通发票和专用发票。单笔金额不低于 100 元可开票，一般 3 个工作日内完成。",
  },
  {
    q: "可以申请退款吗？",
    a: "新用户订阅后 7 天内，若未使用超过 100 点，支持原路退款。点数包充值由于即时到账且永久有效，原则上不支持退款，请按需购买。",
  },
  {
    q: "企业版和个人专业版有什么区别？",
    a: "企业版提供专属客户经理、API 接入、私有化部署、数据隔离、SLA 99.9% 保障以及团队协作功能。适合 5 人以上团队或对数据安全有要求的客户。",
  },
  {
    q: "为什么海外模型在国内能用？",
    a: "灵境 AI 在海外部署有代理节点，将请求合规中转至 OpenAI、Google、Anthropic 等官方 API，并对返回结果进行国内合规审核。你无需翻墙，也不会暴露个人 IP。",
  },
]

export function PricingFaq() {
  return (
    <section className="bg-muted/30">
      <div className="mx-auto max-w-4xl px-4 py-16 md:px-6 md:py-20">
        <div className="text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">常见问题</h2>
          <p className="mt-3 text-pretty text-muted-foreground">仍有疑问？随时联系我们的客服团队。</p>
        </div>

        <Accordion type="single" collapsible className="mt-10 rounded-2xl border border-border bg-card">
          {FAQS.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-border px-5 last:border-0">
              <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
