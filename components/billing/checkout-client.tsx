"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import QRCode from "qrcode"
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  RefreshCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

type PaymentMethod = "wechat" | "alipay"

type Props = {
  planKind: "membership" | "points"
  planCode: string
  planName: string
  amount: number
  originalPrice?: number
  bonusPoints: number
  features: string[]
}

type OrderResp = {
  orderId: string
  qrCode: string
  expiresAt: string
  paymentMethod: PaymentMethod
  amount: number
  planName: string
}

type OrderStatusResp = {
  order: {
    id: string
    status: "pending" | "paid" | "canceled" | "expired" | "refunded" | "failed"
    qrCode: string | null
    paymentMethod: PaymentMethod | null
    expiresAt: string | null
    paidAt: string | null
  }
}

export function CheckoutClient({
  planKind,
  planCode,
  planName,
  amount,
  originalPrice,
  bonusPoints,
  features,
}: Props) {
  const router = useRouter()

  const [method, setMethod] = React.useState<PaymentMethod>("wechat")
  const [creating, setCreating] = React.useState(false)
  const [createError, setCreateError] = React.useState<string | null>(null)

  const [orderId, setOrderId] = React.useState<string | null>(null)
  const [qrImage, setQrImage] = React.useState<string | null>(null)
  const [expiresAt, setExpiresAt] = React.useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = React.useState<number>(0)
  const [pollStatus, setPollStatus] = React.useState<OrderStatusResp["order"]["status"]>("pending")
  const [terminalState, setTerminalState] =
    React.useState<"none" | "paid" | "expired" | "canceled" | "failed">("none")

  // 生成订单
  const handleCreate = React.useCallback(async () => {
    setCreating(true)
    setCreateError(null)
    setQrImage(null)
    setOrderId(null)
    setExpiresAt(null)
    setTerminalState("none")
    setPollStatus("pending")

    try {
      const res = await fetch("/api/payment/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKind, planCode, paymentMethod: method }),
      })
      const json = await res.json()
      if (!res.ok) {
        setCreateError(json.error ?? "创建订单失败")
        if (json.orderId) setOrderId(json.orderId)
        return
      }

      const data = json as OrderResp
      setOrderId(data.orderId)
      setExpiresAt(data.expiresAt)

      const dataUrl = await QRCode.toDataURL(data.qrCode, {
        width: 240,
        margin: 1,
        errorCorrectionLevel: "M",
      })
      setQrImage(dataUrl)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "创建订单失败")
    } finally {
      setCreating(false)
    }
  }, [planKind, planCode, method])

  // 倒计时
  React.useEffect(() => {
    if (!expiresAt) return
    const tick = () => {
      const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
      setSecondsLeft(remaining)
      if (remaining <= 0 && terminalState === "none") {
        setTerminalState("expired")
      }
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [expiresAt, terminalState])

  // 轮询订单状态
  React.useEffect(() => {
    if (!orderId || terminalState !== "none") return
    let cancelled = false

    const poll = async () => {
      try {
        const res = await fetch(`/api/payment/orders/${orderId}`, { cache: "no-store" })
        if (!res.ok) return
        const json = (await res.json()) as OrderStatusResp
        if (cancelled) return
        const status = json.order?.status
        if (!status) return
        setPollStatus(status)
        if (status === "paid") {
          setTerminalState("paid")
          setTimeout(() => {
            router.push(`/billing/result?orderId=${orderId}&status=success`)
          }, 1200)
        } else if (status === "expired") {
          setTerminalState("expired")
        } else if (status === "canceled") {
          setTerminalState("canceled")
        } else if (status === "failed") {
          setTerminalState("failed")
        }
      } catch {
        // 轮询失败忽略，下次重试
      }
    }

    poll()
    const interval = setInterval(poll, 3000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [orderId, terminalState, router])

  const minutesText = React.useMemo(() => {
    const m = Math.floor(secondsLeft / 60)
    const s = secondsLeft % 60
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }, [secondsLeft])

  const showTerminalBanner = terminalState !== "none" && terminalState !== "paid"

  return (
    <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
      {/* 左侧：订单详情 */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">订单详情</h2>
        <dl className="mt-4 grid gap-3 text-sm">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <dt className="text-muted-foreground">商品</dt>
            <dd className="font-medium">{planName}</dd>
          </div>
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <dt className="text-muted-foreground">类型</dt>
            <dd>{planKind === "membership" ? "会员订阅" : "点数充值"}</dd>
          </div>
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <dt className="text-muted-foreground">赠送/含点数</dt>
            <dd className="font-semibold tabular-nums text-primary">
              {bonusPoints.toLocaleString()} 点
            </dd>
          </div>
          <div className="flex items-center justify-between pt-1">
            <dt className="text-muted-foreground">应付金额</dt>
            <dd className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums">¥{amount}</span>
              {originalPrice && originalPrice > amount ? (
                <span className="text-sm text-muted-foreground line-through tabular-nums">
                  ¥{originalPrice}
                </span>
              ) : null}
            </dd>
          </div>
        </dl>

        <ul className="mt-5 space-y-2 border-t border-border/60 pt-4 text-xs text-muted-foreground">
          {features.slice(0, 4).map((f, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-center gap-2 rounded-lg border border-border/50 bg-background/40 px-3 py-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          支付通过收钱吧聚合支付完成，安全可靠
        </div>
      </section>

      {/* 右侧：支付方式 + 二维码 */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">支付方式</h2>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <MethodButton
            active={method === "wechat"}
            disabled={!!orderId && terminalState === "none"}
            onClick={() => setMethod("wechat")}
            icon={<WechatIcon />}
            label="微信支付"
            tone="green"
          />
          <MethodButton
            active={method === "alipay"}
            disabled={!!orderId && terminalState === "none"}
            onClick={() => setMethod("alipay")}
            icon={<AlipayIcon />}
            label="支付宝"
            tone="blue"
          />
        </div>

        <div className="mt-6 flex flex-col items-center">
          {!orderId && !creating ? (
            <div className="flex w-full flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-background/30 p-6 text-center">
              <p className="text-sm text-muted-foreground">点击下方按钮生成支付二维码</p>
              <Button onClick={handleCreate} disabled={creating} size="lg" className="rounded-full px-8">
                生成 ¥{amount} 支付二维码
              </Button>
              {createError ? (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {createError}
                </p>
              ) : null}
            </div>
          ) : null}

          {creating ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Spinner className="h-6 w-6" />
              <p className="text-sm text-muted-foreground">正在创建支付订单...</p>
            </div>
          ) : null}

          {orderId && qrImage ? (
            <div className="flex w-full flex-col items-center gap-4">
              <div
                className={cn(
                  "relative flex h-60 w-60 items-center justify-center rounded-xl border bg-white p-3 transition",
                  terminalState === "paid" && "border-primary",
                  showTerminalBanner && "opacity-60",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrImage} alt="支付二维码" className="h-full w-full object-contain" />

                {terminalState === "paid" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-primary/95 text-primary-foreground">
                    <CheckCircle2 className="h-12 w-12" />
                    <span className="text-base font-semibold">支付成功</span>
                  </div>
                ) : null}
                {terminalState === "expired" ? (
                  <button
                    onClick={handleCreate}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-card/95 text-sm font-medium text-foreground"
                  >
                    <RefreshCcw className="h-8 w-8" />
                    二维码已过期，点击刷新
                  </button>
                ) : null}
                {(terminalState === "canceled" || terminalState === "failed") ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-card/95 text-sm font-medium text-destructive">
                    <XCircle className="h-8 w-8" />
                    支付未完成
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  请使用{method === "wechat" ? "微信" : "支付宝"}扫码支付
                </p>
                {terminalState === "none" && pollStatus === "pending" ? (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    剩余 {minutesText} · 等待付款中...
                  </p>
                ) : null}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCreate}
                disabled={creating}
                className="rounded-full"
              >
                <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
                重新生成
              </Button>
            </div>
          ) : null}

          {createError && orderId ? (
            <p className="mt-4 flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              {createError}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  )
}

function MethodButton({
  active,
  disabled,
  onClick,
  icon,
  label,
  tone,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  tone: "green" | "blue"
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition",
        active
          ? tone === "green"
            ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-500"
            : "border-sky-500/60 bg-sky-500/10 text-sky-500"
          : "border-border bg-background/40 text-muted-foreground hover:border-primary/40 hover:text-foreground",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      {icon}
      {label}
    </button>
  )
}

function WechatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M9.5 4C5.358 4 2 6.91 2 10.5c0 2.07 1.116 3.91 2.86 5.085L4 18l2.7-1.42c.554.135 1.13.21 1.72.232a4.99 4.99 0 0 1-.42-2 5.5 5.5 0 0 1 5.5-5.5c.36 0 .714.034 1.058.099C14.078 6.59 12 4 9.5 4Zm-3 4a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5Zm6 0a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5ZM16 11a4.5 4.5 0 0 0-4.5 4.5c0 1.54.78 2.92 2.04 3.79L13 21l1.94-1.06c.34.07.69.11 1.06.11 2.49 0 4.5-1.91 4.5-4.55C20.5 12.91 18.49 11 16 11Zm-1.6 3.05a.6.6 0 1 1 0 1.2.6.6 0 0 1 0-1.2Zm3.2 0a.6.6 0 1 1 0 1.2.6.6 0 0 1 0-1.2Z" />
    </svg>
  )
}

function AlipayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M5 4h14a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Zm1.5 5.2a3 3 0 0 0 2.8 4.5c1.07 0 2-.55 2.55-1.4a17 17 0 0 0 1.5.7c.86.34 1.93.7 3 .7a4.5 4.5 0 0 0 4.45-3.6h-3.7a4.4 4.4 0 0 1-.6 1.05c-.7-.4-2.32-1.27-2.32-1.27-.4-.21-.97-.55-.97-.55h2.93V8.4h-3.4V7.4h3.95V6.4h-3.95V5h-1.6v1.4H7.6v1h3.55v1H7.65V9.2h6Zm.6 1.55c.5 0 1.04.13 1.86.4-.16.65-.66 1.1-1.36 1.1A1.5 1.5 0 0 1 6.1 10.7c0-.39.13-.74.36-1.02.18.38.36.78.64 1.07Z" />
    </svg>
  )
}
