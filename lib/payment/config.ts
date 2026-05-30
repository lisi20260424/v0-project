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

const SELECT_COLUMNS = "enabled, vendor_sn, vendor_key, app_id, terminal_sn, terminal_key, device_id, operator, notify_url, return_url, gateway_url, callback_public_key, test_mode, updated_at"

export async function loadPaymentSettings(): Promise<PaymentSettingsRow | null> {
  return {
    enabled: false,
    vendor_sn: null,
    vendor_key: null,
    app_id: null,
    terminal_sn: process.env.SQB_TERMINAL_SN ?? null,
    terminal_key: process.env.SQB_TERMINAL_KEY ?? null,
    device_id: null,
    operator: null,
    notify_url: null,
    return_url: null,
    gateway_url: process.env.SQB_GATEWAY_URL ?? null,
    callback_public_key: null,
    test_mode: process.env.NODE_ENV !== "production",
    updated_at: null,
  }
}

export function toShouQianBaConfig(row: PaymentSettingsRow | null): ShouQianBaConfig | null {
  if (!row?.terminal_sn || !row.terminal_key) return null
  const customGateway = row.gateway_url?.trim()
  return {
    terminal_sn: row.terminal_sn,
    terminal_key: row.terminal_key,
    vendor_sn: row.vendor_sn ?? undefined,
    vendor_key: row.vendor_key ?? undefined,
    app_id: row.app_id ?? undefined,
    gateway_url: customGateway || (row.test_mode ? SQB_API_DOMAIN_TEST : SQB_API_DOMAIN_PROD),
    test_mode: row.test_mode,
  }
}

export const PAYMENT_SETTINGS_SELECT = SELECT_COLUMNS
