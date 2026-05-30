import { PaymentResultClient } from "@/components/billing/payment-result-client"

export const dynamic = "force-dynamic"

type SearchParams = Promise<{
  orderId?: string
  status?: string
}>

export default async function PaymentResultPage({ searchParams }: { searchParams: SearchParams }) {
  const { orderId, status } = await searchParams
  return <PaymentResultClient orderId={orderId} status={status} />
}
