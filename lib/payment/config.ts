import { createAdminClient } from "@/lib/supabase/admin"
import { SQB_API_DOMAIN_PROD, SQB_API_DOMAIN_TEST, type ShouQianBaConfig } from "./shouqianba"

export type PaymentSettingsRow = {
  enabled: boolean
  vendor_sn: string | null
  vendor_key: string | null
  app_id: string | null
  terminal_sn: string | null
  terminal_key: string | null
  device_id: string | null
  operator: string | null
  notify_url: string | null
  return_url: string | null
  gateway_url: string | null
  callback_public_key: string | null
  test_mode: boolean
  updated_at: string | null
}

const SELECT_COLUMNS =
  "enabled, vendor_sn, vendor_key, app_id, terminal_sn, terminal_key, device_id, operator, notify_url, return_url, gateway_url, callback_public_key, test_mode, updated_at"

/**
 * 服务端读取支付配置（仅在已通过权限校验的路由中调用）
 */
export async function loadPaymentSettings(): Promise<PaymentSettingsRow | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("admin_payment_settings")
    .select(SELECT_COLUMNS)
    .eq("id", 1)
    .maybeSingle()

  return (data as PaymentSettingsRow | null) ?? null
}

/**
 * 把 DB 行转为 ShouQianBaConfig，缺少 terminal 凭证时返回 null
 */
export function toShouQianBaConfig(row: PaymentSettingsRow | null): ShouQianBaConfig | null {
  if (!row) return null
  if (!row.terminal_sn || !row.terminal_key) return null
  const customGateway = row.gateway_url?.trim()
  const baseGateway =
    customGateway || (row.test_mode ? SQB_API_DOMAIN_TEST : SQB_API_DOMAIN_PROD)
  return {
    terminal_sn: row.terminal_sn,
    terminal_key: row.terminal_key,
    vendor_sn: row.vendor_sn ?? undefined,
    vendor_key: row.vendor_key ?? undefined,
    app_id: row.app_id ?? undefined,
    gateway_url: baseGateway,
    test_mode: row.test_mode,
  }
}

export const PAYMENT_SETTINGS_SELECT = SELECT_COLUMNS
