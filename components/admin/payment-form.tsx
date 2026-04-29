"use client"

import { useState } from "react"
import { AlertCircle, CheckCircle2, Eye, EyeOff, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Spinner } from "@/components/ui/spinner"

export type PaymentSettingsValue = {
  enabled: boolean
  vendorSn: string
  vendorKey: string
  appId: string
  terminalSn: string
  terminalKey: string
  notifyUrl: string
  returnUrl: string
  gatewayUrl: string
  testMode: boolean
  updatedAt: string | null
}

type Props = {
  initialValue: PaymentSettingsValue
}

export function PaymentForm({ initialValue }: Props) {
  const [value, setValue] = useState<PaymentSettingsValue>(initialValue)
  const [showVendorKey, setShowVendorKey] = useState(false)
  const [showTerminalKey, setShowTerminalKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  function update<K extends keyof PaymentSettingsValue>(key: K, v: PaymentSettingsValue[K]) {
    setValue((prev) => ({ ...prev, [key]: v }))
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch("/api/admin/payment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "保存失败")
      setMessage({ ok: true, text: "支付配置已更新" })
      setValue((prev) => ({ ...prev, updatedAt: new Date().toISOString() }))
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({
        ok: false,
        text: err instanceof Error ? err.message : "保存失败，请稍后重试",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5">
      {/* 启用开关 */}
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wallet className="h-4 w-4" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h2 className="text-base font-semibold">收钱吧支付</h2>
              <p className="text-xs text-muted-foreground">
                启用后，用户购买会员/点数包时通过收钱吧聚合支付完成微信/支付宝扫码支付
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="enabled" className="text-xs text-muted-foreground">
              {value.enabled ? "已启用" : "未启用"}
            </Label>
            <Switch
              id="enabled"
              checked={value.enabled}
              onCheckedChange={(v) => update("enabled", v)}
              disabled={saving}
            />
          </div>
        </div>
      </section>

      {/* 凭证 */}
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-semibold">商户凭证</h2>
          <p className="text-xs text-muted-foreground">
            从收钱吧商户后台获取，所有密钥仅在服务端读取
          </p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="vendor-sn">服务商编号 (vendor_sn)</Label>
            <Input
              id="vendor-sn"
              value={value.vendorSn}
              onChange={(e) => update("vendorSn", e.target.value)}
              placeholder="自营模式留空"
              disabled={saving}
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="app-id">应用 ID (app_id)</Label>
            <Input
              id="app-id"
              value={value.appId}
              onChange={(e) => update("appId", e.target.value)}
              placeholder="选填"
              disabled={saving}
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-2">
            <Label htmlFor="vendor-key">服务商密钥 (vendor_key)</Label>
            <div className="relative">
              <Input
                id="vendor-key"
                type={showVendorKey ? "text" : "password"}
                value={value.vendorKey}
                onChange={(e) => update("vendorKey", e.target.value)}
                placeholder="自营模式留空"
                disabled={saving}
                autoComplete="off"
                className="pr-10 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setShowVendorKey((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label={showVendorKey ? "隐藏" : "显示"}
              >
                {showVendorKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="terminal-sn">终端编号 (terminal_sn)</Label>
            <Input
              id="terminal-sn"
              value={value.terminalSn}
              onChange={(e) => update("terminalSn", e.target.value)}
              placeholder="终端激活后获取"
              disabled={saving}
              autoComplete="off"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="terminal-key">终端密钥 (terminal_key)</Label>
            <div className="relative">
              <Input
                id="terminal-key"
                type={showTerminalKey ? "text" : "password"}
                value={value.terminalKey}
                onChange={(e) => update("terminalKey", e.target.value)}
                placeholder="终端激活后获取"
                disabled={saving}
                autoComplete="off"
                required
                className="pr-10 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setShowTerminalKey((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label={showTerminalKey ? "隐藏" : "显示"}
              >
                {showTerminalKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 网关与回调 */}
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-semibold">网关与回调</h2>
          <p className="text-xs text-muted-foreground">
            支付网关地址、用户支付完成后的跳转地址和服务端异步通知地址
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gateway-url">支付网关地址</Label>
            <Input
              id="gateway-url"
              type="url"
              value={value.gatewayUrl}
              onChange={(e) => update("gatewayUrl", e.target.value)}
              placeholder="https://vsi-api.shouqianba.com"
              disabled={saving}
            />
            <p className="text-[11px] text-muted-foreground">
              生产环境：https://vsi-api.shouqianba.com，沙箱环境：https://test-api-vsi.shouqianba.com，留空将根据测试模式自动选择
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notify-url">异步通知地址 (notify_url)</Label>
            <Input
              id="notify-url"
              type="url"
              value={value.notifyUrl}
              onChange={(e) => update("notifyUrl", e.target.value)}
              placeholder="https://your-domain.com/api/payment/notify"
              disabled={saving}
            />
            <p className="text-[11px] text-muted-foreground">
              收钱吧支付成功后服务端推送通知的地址，必须公网可访问
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="return-url">同步跳转地址 (return_url)</Label>
            <Input
              id="return-url"
              type="url"
              value={value.returnUrl}
              onChange={(e) => update("returnUrl", e.target.value)}
              placeholder="https://your-domain.com/billing/result"
              disabled={saving}
            />
            <p className="text-[11px] text-muted-foreground">
              用户在收钱吧支付页完成后浏览器跳转地址，留空则使用站内默认结果页
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-4 py-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">沙箱测试模式</span>
              <span className="text-[11px] text-muted-foreground">
                开启后下单将使用收钱吧沙箱环境，不会产生真实交易
              </span>
            </div>
            <Switch
              checked={value.testMode}
              onCheckedChange={(v) => update("testMode", v)}
              disabled={saving}
            />
          </div>
        </div>
      </section>

      {message ? (
        <div
          className={
            message.ok
              ? "flex items-start gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary"
              : "flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          }
        >
          {message.ok ? (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {value.updatedAt
            ? `上次更新：${new Date(value.updatedAt).toLocaleString("zh-CN")}`
            : "尚未配置"}
        </p>
        <Button type="submit" disabled={saving}>
          {saving ? <Spinner className="mr-2 h-4 w-4" /> : null}
          {saving ? "保存中..." : "保存配置"}
        </Button>
      </div>
    </form>
  )
}
