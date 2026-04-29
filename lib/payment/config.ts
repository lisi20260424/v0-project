import { createAdminClient } from "@/lib/supabase/admin"
import type { ShouQianBaConfig } from "./shouqianba"

export type PaymentSettingsRow = {
  enabled: boolean
  vendor_sn: string | null
  vendor_key: string | null
  app_id: string | null
  terminal_sn: string | null
  terminal_key: string | null
  notify_url: string | null
  return_url: string | null
  gateway_url: string | null
  test_mode: boolean
}

/**
 * 服务端读取支付配置（仅在已通过权限校验的路由中调用）
 */
export async function loadPaymentSettings(): Promise<PaymentSettingsRow | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("admin_payment_settings")
    .select(
      "enabled, vendor_sn, vendor_key, app_id, terminal_sn, terminal_key, notify_url, return_url, gateway_url, test_mode",
    )
    .eq("id", 1)
    .maybeSingle()

  return (data as PaymentSettingsRow | null) ?? null
}

/**
 * 把 DB 行转为 ShouQianBaConfig，未配置则返回 null
 */
export function toShouQianBaConfig(row: PaymentSettingsRow | null): ShouQianBaConfig | null {
  if (!row) return null
  if (!row.terminal_sn || !row.terminal_key) return null
  const baseGateway = row.gateway_url?.trim() || "https://qr.shouqianba.com"
  return {
    terminal_sn: row.terminal_sn,
    terminal_key: row.terminal_key,
    vendor_sn: row.vendor_sn ?? undefined,
    vendor_key: row.vendor_key ?? undefined,
    app_id: row.app_id ?? undefined,
    gateway_url: row.test_mode ? "https://qr-test4.shouqianba.com" : baseGateway,
    test_mode: row.test_mode,
  }
}
