/**
 * 收钱吧（ShouQianBa）聚合支付服务
 *
 * 官方文档：https://doc.shouqianba.com/zh-cn/
 *
 * 接口：
 * - 激活：POST {api_domain}/terminal/activate（用 vendor_sn / vendor_key 签名）
 * - 签到：POST {api_domain}/terminal/checkin（用 terminal_sn / terminal_key 签名）
 * - 预下单：POST {api_domain}/upay/v2/precreate
 * - 查询：POST {api_domain}/upay/v2/query
 * - 撤单：POST {api_domain}/upay/v2/cancel
 *
 * 签名机制：
 *   sign = MD5(body + key)
 *   Authorization: <sn> <sign>
 *
 * 金额单位：分（字符串）
 * payway: 1=微信, 2=支付宝（C扫B 预下单），新版 SDK 也用 3=微信、2=支付宝（兼容多种通道）。
 * 这里采用文档示例中的通用约定：2=支付宝，3=微信。
 */

import crypto from "node:crypto"

export const SQB_API_DOMAIN_PROD = "https://vsi-api.shouqianba.com"
export const SQB_API_DOMAIN_TEST = "https://test-api-vsi.shouqianba.com"

export type ShouQianBaConfig = {
  terminal_sn: string
  terminal_key: string
  vendor_sn?: string
  vendor_key?: string
  app_id?: string
  gateway_url: string
  test_mode: boolean
}

export type SqbResponse<T> = {
  result_code: string
  error_code?: string
  error_message?: string
  biz_response?: {
    result_code?: string
    error_code?: string
    error_message?: string
    data?: T
    /** 部分接口（如激活/签到）会把字段直接放在 biz_response 上 */
    terminal_sn?: string
    terminal_key?: string
  }
}

export type PrecreateData = {
  sn?: string
  client_sn?: string
  trade_no?: string
  status?: string
  order_status?: string
  qr_code?: string
  payway?: string
  sub_payway?: string
  total_amount?: string
}

export type QueryData = {
  sn?: string
  client_sn?: string
  trade_no?: string
  /** CREATED / IN_PROG / PAID / PAY_CANCELED / REFUNDED / PAY_ERROR */
  order_status?: string
  status?: string
  payway?: string
  payway_name?: string
  total_amount?: string
  net_amount?: string
  finish_time?: string
  reflect?: string
}

export type ActivateData = {
  terminal_sn?: string
  terminal_key?: string
}

export type PrecreateParams = {
  /** 商户系统订单号（≤32 位、必须唯一） */
  client_sn: string
  /** 交易总金额（单位：分，字符串） */
  total_amount: string
  /** 一级支付方式：2=支付宝，3=微信 */
  payway: string
  /** 商品概述 */
  subject: string
  /** 操作员 */
  operator: string
  /** 商品详情（可选） */
  description?: string
  /** 异步通知地址（可选） */
  notify_url?: string
  /** 透传字段（可选） */
  reflect?: string
}

/** 计算签名 sign = MD5(body + key) */
function sign(bodyJson: string, key: string): string {
  return crypto.createHash("md5").update(bodyJson + key, "utf8").digest("hex")
}

async function request<T>(
  url: string,
  body: Record<string, unknown>,
  authSn: string,
  authKey: string,
): Promise<SqbResponse<T>> {
  const bodyJson = JSON.stringify(body)
  const authorization = `${authSn} ${sign(bodyJson, authKey)}`

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authorization,
    },
    body: bodyJson,
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error(`收钱吧请求失败：HTTP ${res.status}`)
  }

  return (await res.json()) as SqbResponse<T>
}

function gateway(config: Pick<ShouQianBaConfig, "gateway_url" | "test_mode">) {
  const url =
    config.gateway_url?.trim() ||
    (config.test_mode ? SQB_API_DOMAIN_TEST : SQB_API_DOMAIN_PROD)
  return url.replace(/\/$/, "")
}

/**
 * 终端激活
 * 使用 vendor_sn + vendor_key 签名
 */
export async function activate(
  config: ShouQianBaConfig,
  params: { code: string; device_id: string; client_sn?: string; name?: string },
): Promise<SqbResponse<ActivateData>> {
  if (!config.vendor_sn || !config.vendor_key) {
    throw new Error("缺少服务商凭证：vendor_sn / vendor_key")
  }
  if (!config.app_id) {
    throw new Error("缺少应用 ID（app_id）")
  }
  const body: Record<string, unknown> = {
    app_id: config.app_id,
    code: params.code,
    device_id: params.device_id,
  }
  if (params.client_sn) body.client_sn = params.client_sn
  if (params.name) body.name = params.name

  return request<ActivateData>(
    `${gateway(config)}/terminal/activate`,
    body,
    config.vendor_sn,
    config.vendor_key,
  )
}

/**
 * 终端签到（更新当日 terminal_key）
 */
export async function checkin(
  config: ShouQianBaConfig,
  params: { device_id: string },
): Promise<SqbResponse<ActivateData>> {
  if (!config.terminal_sn || !config.terminal_key) {
    throw new Error("缺少终端凭证：terminal_sn / terminal_key")
  }
  return request<ActivateData>(
    `${gateway(config)}/terminal/checkin`,
    { terminal_sn: config.terminal_sn, device_id: params.device_id },
    config.terminal_sn,
    config.terminal_key,
  )
}

/** 预下单（C扫B - 用户主扫聚合二维码） */
export async function precreate(
  config: ShouQianBaConfig,
  params: PrecreateParams,
): Promise<SqbResponse<PrecreateData>> {
  const body: Record<string, unknown> = {
    terminal_sn: config.terminal_sn,
    client_sn: params.client_sn,
    total_amount: params.total_amount,
    payway: params.payway,
    subject: params.subject,
    operator: params.operator,
  }
  if (params.description) body.description = params.description
  if (params.notify_url) body.notify_url = params.notify_url
  if (params.reflect) body.reflect = params.reflect

  return request<PrecreateData>(
    `${gateway(config)}/upay/v2/precreate`,
    body,
    config.terminal_sn,
    config.terminal_key,
  )
}

/** 查询订单 */
export async function query(
  config: ShouQianBaConfig,
  clientSn: string,
): Promise<SqbResponse<QueryData>> {
  return request<QueryData>(
    `${gateway(config)}/upay/v2/query`,
    { terminal_sn: config.terminal_sn, client_sn: clientSn },
    config.terminal_sn,
    config.terminal_key,
  )
}

/** 撤单 */
export async function cancel(
  config: ShouQianBaConfig,
  clientSn: string,
): Promise<SqbResponse<QueryData>> {
  return request<QueryData>(
    `${gateway(config)}/upay/v2/cancel`,
    { terminal_sn: config.terminal_sn, client_sn: clientSn },
    config.terminal_sn,
    config.terminal_key,
  )
}

/**
 * 验证异步通知签名
 * 收钱吧异步通知头 Authorization 形式： <terminal_sn> <md5(body+terminal_key)>
 */
export function verifyNotifySignature(
  rawBody: string,
  authorization: string,
  terminalKey: string,
): boolean {
  if (!authorization) return false
  const parts = authorization.trim().split(/\s+/)
  const remoteSign = (parts[1] ?? parts[0] ?? "").toLowerCase()
  const localSign = sign(rawBody, terminalKey).toLowerCase()
  return remoteSign === localSign
}

/** 生成 24-32 位业务订单号（仅含字母数字） */
export function generateClientSn(prefix = "VS"): string {
  const ts = Date.now().toString()
  const rand = crypto.randomBytes(6).toString("hex").toUpperCase()
  return `${prefix}${ts}${rand}`.slice(0, 32)
}

/** 把支付方式映射为收钱吧 payway */
export function paymentMethodToPayway(method: "wechat" | "alipay"): string {
  // 文档约定：2 = 支付宝，3 = 微信
  return method === "alipay" ? "2" : "3"
}

/** 把订单状态映射到本地 status */
export function mapOrderStatus(orderStatus?: string): "pending" | "paid" | "canceled" | "failed" {
  switch (orderStatus) {
    case "PAID":
    case "PAY_SUCCESS":
      return "paid"
    case "PAY_CANCELED":
    case "REVOKED":
    case "CANCELED":
      return "canceled"
    case "PAY_ERROR":
    case "FAILED":
      return "failed"
    default:
      return "pending"
  }
}
