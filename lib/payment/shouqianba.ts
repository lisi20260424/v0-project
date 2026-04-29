/**
 * 收钱吧（ShouQianBa）聚合支付服务
 *
 * 文档参考：
 * - 预下单：POST {gateway}/upay/v2/precreate
 * - 查询订单：POST {gateway}/upay/v2/query
 * - 撤销订单：POST {gateway}/upay/v2/cancel
 *
 * 鉴权方式（基于 terminal）：
 *   Authorization: <terminal_sn> <md5(JSON.stringify(body) + terminal_key)>
 *
 * 测试模式下使用沙箱网关 https://qr-test4.shouqianba.com
 */

import crypto from "node:crypto"

export type ShouQianBaConfig = {
  terminal_sn: string
  terminal_key: string
  vendor_sn?: string
  vendor_key?: string
  app_id?: string
  gateway_url: string
  test_mode: boolean
}

export type PrecreateParams = {
  /** 业务订单号（要求 24-32 位，全局唯一） */
  client_sn: string
  /** 总金额（单位：分），需为字符串 */
  total_amount: string
  /** 支付方式：3=支付宝 BARCODE / 1=微信 BARCODE，但二维码扫码使用 0=用户主扫；这里用通用 wxpay/alipay */
  payway?: string
  /** 订单标题 */
  subject: string
  /** 操作员 */
  operator: string
  /** 异步通知地址 */
  notify_url?: string
  /** 用于业务扩展 */
  description?: string
  /** 客户端 IP */
  payer_uid?: string
  /** 附加业务数据，建议存储 user_id/order_id */
  reflect?: string
}

export type PrecreateResponse = {
  result_code: string
  error_code?: string
  error_message?: string
  biz_response?: {
    result_code: string
    error_code?: string
    error_message?: string
    terminal_sn?: string
    sn?: string
    client_sn?: string
    trade_no?: string
    status?: string
    order_status?: string
    /** 收钱吧聚合二维码内容（可生成二维码图片） */
    qr_code?: string
    payway?: string
  }
}

export type QueryResponse = {
  result_code: string
  error_code?: string
  error_message?: string
  biz_response?: {
    result_code: string
    error_code?: string
    error_message?: string
    data?: {
      sn?: string
      client_sn?: string
      trade_no?: string
      /** PAID / CREATED / PAY_CANCELED / PAY_ERROR / PAY_CANCELING / WAIT_USER / REFUNDED */
      order_status?: string
      payway?: string
      total_amount?: string
      net_amount?: string
      finish_time?: string
      reflect?: string
    }
  }
}

/**
 * 计算签名：MD5(body_json + terminal_key)
 */
function sign(bodyJson: string, terminalKey: string): string {
  return crypto
    .createHash("md5")
    .update(bodyJson + terminalKey, "utf8")
    .digest("hex")
    .toUpperCase()
}

async function request<T>(
  config: ShouQianBaConfig,
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const bodyJson = JSON.stringify(body)
  const auth = `${config.terminal_sn} ${sign(bodyJson, config.terminal_key)}`
  const url = `${config.gateway_url.replace(/\/$/, "")}${path}`

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: auth,
    },
    body: bodyJson,
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error(`收钱吧请求失败：HTTP ${res.status}`)
  }

  const data = (await res.json()) as T
  return data
}

/**
 * 预下单 - 用户主扫聚合二维码
 * total_amount 单位：分，字符串
 */
export async function precreate(
  config: ShouQianBaConfig,
  params: PrecreateParams,
): Promise<PrecreateResponse> {
  const body: Record<string, unknown> = {
    terminal_sn: config.terminal_sn,
    client_sn: params.client_sn,
    total_amount: params.total_amount,
    subject: params.subject,
    operator: params.operator,
  }

  if (params.payway) body.payway = params.payway
  if (params.notify_url) body.notify_url = params.notify_url
  if (params.description) body.description = params.description
  if (params.reflect) body.reflect = params.reflect

  return request<PrecreateResponse>(config, "/upay/v2/precreate", body)
}

/**
 * 查询订单状态
 */
export async function query(
  config: ShouQianBaConfig,
  clientSn: string,
): Promise<QueryResponse> {
  return request<QueryResponse>(config, "/upay/v2/query", {
    terminal_sn: config.terminal_sn,
    client_sn: clientSn,
  })
}

/**
 * 撤销订单
 */
export async function cancel(
  config: ShouQianBaConfig,
  clientSn: string,
): Promise<QueryResponse> {
  return request<QueryResponse>(config, "/upay/v2/cancel", {
    terminal_sn: config.terminal_sn,
    client_sn: clientSn,
  })
}

/**
 * 验证异步通知签名
 * 收钱吧异步通知的 Authorization 形式：sign=<md5(body+terminal_key)>
 */
export function verifyNotifySignature(
  rawBody: string,
  authorization: string,
  terminalKey: string,
): boolean {
  if (!authorization) return false
  // Authorization 头通常为：terminal_sn signature
  const parts = authorization.trim().split(/\s+/)
  const remoteSign = (parts[1] ?? parts[0] ?? "").toUpperCase()
  const localSign = sign(rawBody, terminalKey)
  return remoteSign === localSign
}

/**
 * 生成业务订单号（24-32 位）
 * 格式：时间戳 + 随机串
 */
export function generateClientSn(prefix = "VS"): string {
  const ts = Date.now().toString()
  const rand = crypto.randomBytes(6).toString("hex").toUpperCase()
  return `${prefix}${ts}${rand}`.slice(0, 32)
}

/**
 * 将订单状态映射到本地 status
 */
export function mapOrderStatus(orderStatus?: string): "pending" | "paid" | "canceled" | "failed" {
  switch (orderStatus) {
    case "PAID":
    case "PAY_SUCCESS":
      return "paid"
    case "PAY_CANCELED":
    case "REVOKED":
      return "canceled"
    case "PAY_ERROR":
    case "FAILED":
      return "failed"
    default:
      return "pending"
  }
}
