import { createAdminClient } from "@/lib/supabase/admin"
import { PaymentForm, type PaymentSettingsValue } from "@/components/admin/payment-form"
import { PAYMENT_SETTINGS_SELECT } from "@/lib/payment/config"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "支付配置 · 系统设置",
}

export default async function PaymentSettingsPage() {
  const admin = createAdminClient()
  const { data } = await admin
    .from("admin_payment_settings")
    .select(PAYMENT_SETTINGS_SELECT)
    .eq("id", 1)
    .maybeSingle()

  const initial: PaymentSettingsValue = {
    enabled: data?.enabled ?? false,
    vendorSn: data?.vendor_sn ?? "",
    vendorKey: data?.vendor_key ?? "",
    appId: data?.app_id ?? "",
    terminalSn: data?.terminal_sn ?? "",
    terminalKey: data?.terminal_key ?? "",
    deviceId: data?.device_id ?? "",
    operator: data?.operator ?? "",
    notifyUrl: data?.notify_url ?? "",
    returnUrl: data?.return_url ?? "",
    gatewayUrl: data?.gateway_url ?? "",
    callbackPublicKey: data?.callback_public_key ?? "",
    testMode: data?.test_mode ?? true,
    updatedAt: data?.updated_at ?? null,
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">支付配置</h2>
        <p className="text-xs text-muted-foreground">
          配置收钱吧聚合支付凭证、激活终端，启用后用户可通过微信/支付宝扫码支付
        </p>
      </div>
      <PaymentForm initialValue={initial} />
    </div>
  )
}
