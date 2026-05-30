import { PaymentForm, type PaymentSettingsValue } from "@/components/admin/payment-form"

export const dynamic = "force-dynamic"
export const metadata = { title: "支付配置 | 系统设置" }

export default async function PaymentSettingsPage() {
  const initial: PaymentSettingsValue = { enabled: false, vendorSn: "", vendorKey: "", appId: "", terminalSn: "", terminalKey: "", deviceId: "", operator: "", notifyUrl: "", returnUrl: "", gatewayUrl: "", callbackPublicKey: "", testMode: true, updatedAt: null }
  return <div className="flex flex-col gap-6"><div><h2 className="text-lg font-semibold">支付配置</h2><p className="mt-1 text-xs text-muted-foreground">配置将通过 Go API `/v1/admin/payment` 保存。</p></div><PaymentForm initialValue={initial} /></div>
}
