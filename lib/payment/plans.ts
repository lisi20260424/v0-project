/**
 * 会员套餐与点数套餐定义（前后端共享）
 * 价格单位：人民币元
 */

export type MembershipPlan = {
  id: string
  name: string
  price: number
  originalPrice: number
  perDay: string
  save: number
  bonusPoints: number
  vipTier: "monthly" | "annual" | "lifetime"
  /** 会员有效期（天），lifetime 为 null 表示永久 */
  validDays: number | null
  badge?: string
  badgeTone?: "primary" | "accent" | "orange"
  recommended?: boolean
  features: string[]
}

export type PointsPackage = {
  id: string
  points: number
  totalPoints: number
  price: number
  originalPrice: number
  perHundred: string
  save: number
  badge?: string
  features: string[]
  recommended?: boolean
}

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: "monthly",
    name: "月会员",
    price: 29.8,
    originalPrice: 128,
    perDay: "约 1.0 元/天",
    save: 98.2,
    bonusPoints: 3000,
    vipTier: "monthly",
    validDays: 30,
    badge: "限时优惠",
    badgeTone: "orange",
    features: [
      "赠送 3000 点数，点数永久有效",
      "专享点数消耗折扣",
      "付费点数永不过期，永久有效",
      "享受会员权益价",
    ],
  },
  {
    id: "yearly",
    name: "年会员",
    price: 198,
    originalPrice: 398,
    perDay: "约 0.5 元/天",
    save: 200,
    bonusPoints: 20500,
    vipTier: "annual",
    validDays: 365,
    badge: "限时优惠",
    badgeTone: "orange",
    features: [
      "赠送 20500 点数，点数永久有效",
      "包含月会员所有权益",
      "尊享优化体验功能升级，功能上新",
      "尊享专属 1 对 1 客服",
      "享受会员权益价",
    ],
  },
  {
    id: "lifetime",
    name: "终身会员",
    price: 298,
    originalPrice: 698,
    perDay: "约 9.9 元/年",
    save: 400,
    bonusPoints: 31000,
    vipTier: "lifetime",
    validDays: null,
    badge: "最强选择",
    badgeTone: "primary",
    recommended: true,
    features: [
      "赠送 31000 点数，点数永久有效",
      "点数可用于 AI 编辑、AI 视频编辑全产品",
      "包含年度会员所有权益",
      "尊享专属 VIP1 客服",
      "享受会员权益价",
    ],
  },
]

export const POINTS_PACKAGES: PointsPackage[] = [
  {
    id: "p-3000",
    points: 3000,
    totalPoints: 5100,
    price: 50,
    originalPrice: 238,
    perHundred: "约 1.0 元/100 点",
    save: 188,
    badge: "限时优惠",
    features: [
      "含 5100 点数，点数永久有效",
      "点数可用于 AI 编辑、AI 视频编辑全产品",
      "付费点数永不过期，永久有效",
      "会员用户享受点数折扣",
      "丰富的创意视频模板全部可用",
    ],
  },
  {
    id: "p-20000",
    points: 20000,
    totalPoints: 20000,
    price: 190,
    originalPrice: 298,
    perHundred: "约 0.9 元/100 点",
    save: 108,
    badge: "限时优惠",
    features: ["含 20000 点数，点数永久有效", "包含 3000 点套餐所有权益", "尊享专属 1 对 1 客服"],
  },
  {
    id: "p-100000",
    points: 100000,
    totalPoints: 100000,
    price: 899,
    originalPrice: 1798,
    perHundred: "约 0.9 元/100 点",
    save: 899,
    badge: "限时优惠",
    features: ["含 100000 点数，点数永久有效", "尊享专属 VIP1 客服"],
  },
]

export type PlanKind = "membership" | "points"

/** 通过 plan_kind + plan_code 查找套餐数据 */
export function findPlan(kind: PlanKind, planCode: string) {
  if (kind === "membership") {
    return MEMBERSHIP_PLANS.find((p) => p.id === planCode) ?? null
  }
  return POINTS_PACKAGES.find((p) => p.id === planCode) ?? null
}
