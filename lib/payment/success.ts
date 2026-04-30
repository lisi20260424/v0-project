/**
 * 支付成功后置处理
 * - 更新订单状态为 paid
 * - 发放点数并更新用户余额
 * - 设置 VIP 等级与有效期
 * - 写入账单流水
 *
 * 通过订单 ID 幂等执行：若订单已是 paid 状态则直接返回，避免重复发放。
 */

import { createAdminClient } from "@/lib/supabase/admin"

export type SuccessResult = {
  success: boolean
  alreadyProcessed?: boolean
  error?: string
  bonusPoints?: number
  newBalance?: number
}

export async function handlePaymentSuccess(orderId: string): Promise<SuccessResult> {
  const admin = createAdminClient()

  const { data: order, error } = await admin
    .from("subscription_orders")
    .select(
      "id, user_id, plan_kind, plan_code, plan_name, amount, bonus_points, vip_tier, vip_starts_at, vip_expires_at, status, payment_method",
    )
    .eq("id", orderId)
    .maybeSingle()

  if (error || !order) {
    return { success: false, error: "订单不存在" }
  }

  if (order.status === "paid") {
    return { success: true, alreadyProcessed: true }
  }

  // 更新订单
  const now = new Date().toISOString()
  const { error: updErr } = await admin
    .from("subscription_orders")
    .update({ status: "paid", paid_at: now })
    .eq("id", order.id)
    .eq("status", "pending")

  if (updErr) {
    return { success: false, error: updErr.message }
  }

  // 读取当前用户档案
  const { data: profile } = await admin
    .from("profiles")
    .select("points, vip_tier, vip_expires_at")
    .eq("id", order.user_id)
    .maybeSingle()

  const currentPoints = Number(profile?.points ?? 0)
  const bonus = Number(order.bonus_points ?? 0)
  const newBalance = currentPoints + bonus

  // 计算 VIP 信息（会员套餐）
  let nextVipTier: string | null = profile?.vip_tier ?? null
  let nextVipExpiresAt: string | null = profile?.vip_expires_at ?? null

  if (order.plan_kind === "membership" && order.vip_tier) {
    nextVipTier = order.vip_tier
    if (order.vip_tier === "lifetime") {
      nextVipExpiresAt = null
    } else if (order.vip_expires_at) {
      // 若用户已有未过期会员，则在原期限上叠加；否则使用订单计算的过期时间
      const orderExpires = new Date(order.vip_expires_at)
      const existingExpires = profile?.vip_expires_at
        ? new Date(profile.vip_expires_at)
        : null
      if (existingExpires && existingExpires.getTime() > Date.now()) {
        const days = Math.round(
          (orderExpires.getTime() - new Date(order.vip_starts_at ?? now).getTime()) /
            (1000 * 60 * 60 * 24),
        )
        const merged = new Date(existingExpires)
        merged.setDate(merged.getDate() + days)
        nextVipExpiresAt = merged.toISOString()
      } else {
        nextVipExpiresAt = orderExpires.toISOString()
      }
    }
  }

  // 更新用户档案
  const profilePatch: Record<string, unknown> = { points: newBalance }
  if (order.plan_kind === "membership") {
    profilePatch.vip_tier = nextVipTier
    profilePatch.vip_expires_at = nextVipExpiresAt
  }

  const { error: profileErr } = await admin
    .from("profiles")
    .update(profilePatch)
    .eq("id", order.user_id)

  if (profileErr) {
    return { success: false, error: profileErr.message }
  }

  // 写充值账单
  await admin.from("billing_records").insert({
    user_id: order.user_id,
    type: "recharge",
    direction: "in",
    amount: Number(order.amount),
    points: 0,
    description: `购买${order.plan_name}`,
    payment_method: order.payment_method,
    related_order_id: order.id,
    metadata: { plan_kind: order.plan_kind, plan_code: order.plan_code },
  })

  // 写赠送点数账单
  if (bonus > 0) {
    await admin.from("billing_records").insert({
      user_id: order.user_id,
      type: "bonus",
      direction: "in",
      amount: null,
      points: bonus,
      points_balance_after: newBalance,
      description: `${order.plan_name}赠送点数`,
      related_order_id: order.id,
      metadata: { plan_kind: order.plan_kind },
    })
  }

  return { success: true, bonusPoints: bonus, newBalance }
}
