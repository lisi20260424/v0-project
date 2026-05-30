import { PaymentForm, type PaymentSettingsValue } from "@/components/admin/payment-form"
export const dynamic = "force-dynamic"
export const metadata = { title: "支付配置 · 系统设置" }
export default async function PaymentSettingsPage() {
  const initial: PaymentSettingsValue = { enabled: false, vendorSn: "", vendorKey: "", appId: "", terminalSn: "", terminalKey: "", deviceId: "", operator: "", notifyUrl: "", returnUrl: "", gatewayUrl: "", callbackPublicKey: "", testMode: true, updatedAt: null }
  return <div className="flex flex-col gap-6"><div className="flex flex-col gap-1"><h2 className="text-lg font-semibold">支付配置</h2><p className="text-xs text-muted-foreground">配置收钱吧聚合支付凭证、激活终端，启用后用户可通过微信/支付宝扫码支付</p></div><PaymentForm initialValue={initial} /></div>
}
