"use client"

import { useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCw,
  Server,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type PaymentSettingsValue = {
  enabled: boolean
  vendorSn: string
  vendorKey: string
  appId: string
  terminalSn: string
  terminalKey: string
  deviceId: string
  operator: string
  notifyUrl: string
  returnUrl: string
  gatewayUrl: string
  callbackPublicKey: string
  testMode: boolean
  updatedAt: string | null
}

type Props = {
  initialValue: PaymentSettingsValue
}

type ToastMessage = { ok: boolean; text: string }

function rowToValue(row: Record<string, unknown> | null | undefined, fallback: PaymentSettingsValue): PaymentSettingsValue {
  if (!row) return fallback
  return {
    enabled: !!row.enabled,
    vendorSn: (row.vendor_sn as string) ?? "",
    vendorKey: (row.vendor_key as string) ?? "",
    appId: (row.app_id as string) ?? "",
    terminalSn: (row.terminal_sn as string) ?? "",
    terminalKey: (row.terminal_key as string) ?? "",
    deviceId: (row.device_id as string) ?? "",
    operator: (row.operator as string) ?? "",
    notifyUrl: (row.notify_url as string) ?? "",
    returnUrl: (row.return_url as string) ?? "",
    gatewayUrl: (row.gateway_url as string) ?? "",
    callbackPublicKey: (row.callback_public_key as string) ?? "",
    testMode: !!row.test_mode,
    updatedAt: (row.updated_at as string) ?? null,
  }
}

export function PaymentForm({ initialValue }: Props) {
  const [value, setValue] = useState<PaymentSettingsValue>(initialValue)
  const [showVendorKey, setShowVendorKey] = useState(false)
  const [showTerminalKey, setShowTerminalKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<ToastMessage | null>(null)

  // 激活/签到状态
  const [activating, setActivating] = useState(false)
  const [activateOpen, setActivateOpen] = useState(false)
  const [activateCode, setActivateCode] = useState("")
  const [activateName, setActivateName] = useState("")
  const [checkingIn, setCheckingIn] = useState(false)

  function update<K extends keyof PaymentSettingsValue>(key: K, v: PaymentSettingsValue[K]) {
    setValue((prev) => ({ ...prev, [key]: v }))
  }

  function showMessage(toast: ToastMessage, ms = 3000) {
    setMessage(toast)
    if (ms > 0) {
      window.setTimeout(() => setMessage(null), ms)
    }
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
      // 用后端返回的最新数据重新初始化表单状态
      setValue((prev) => rowToValue(json.data, prev))
      showMessage({ ok: true, text: "支付配置已更新" })
    } catch (err) {
      showMessage({ ok: false, text: err instanceof Error ? err.message : "保存失败" }, 5000)
    } finally {
      setSaving(false)
    }
  }

  async function handleActivate() {
    if (!activateCode.trim()) {
      showMessage({ ok: false, text: "请填写激活码" }, 5000)
      return
    }
    setActivating(true)
    setMessage(null)
    try {
      const res = await fetch("/api/admin/payment/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: activateCode.trim(),
          deviceId: value.deviceId,
          name: activateName.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error ?? "激活失败")

      // 拉取最新配置回填
      const latest = await fetch("/api/admin/payment", { cache: "no-store" })
      const latestJson = await latest.json()
      setValue((prev) => rowToValue(latestJson.data, prev))

      setActivateOpen(false)
      setActivateCode("")
      setActivateName("")
      showMessage({ ok: true, text: "终端激活成功，已更新终端凭证" }, 4000)
    } catch (err) {
      showMessage(
        { ok: false, text: err instanceof Error ? err.message : "激活失败" },
        5000,
      )
    } finally {
      setActivating(false)
    }
  }

  async function handleCheckin() {
    setCheckingIn(true)
    setMessage(null)
    try {
      const res = await fetch("/api/admin/payment/checkin", { method: "POST" })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error ?? "签到失败")

      const latest = await fetch("/api/admin/payment", { cache: "no-store" })
      const latestJson = await latest.json()
      setValue((prev) => rowToValue(latestJson.data, prev))

      showMessage({ ok: true, text: json.message ?? "签到成功" }, 4000)
    } catch (err) {
      showMessage(
        { ok: false, text: err instanceof Error ? err.message : "签到失败" },
        5000,
      )
    } finally {
      setCheckingIn(false)
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

      {/* 商户凭证 */}
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
              placeholder="收钱吧分配的应用 ID"
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
              placeholder="终端激活后自动写入"
              disabled={saving}
              autoComplete="off"
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
                placeholder="终端激活/签到后自动写入"
                disabled={saving}
                autoComplete="off"
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

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="device-id">设备 ID (device_id)</Label>
            <Input
              id="device-id"
              value={value.deviceId}
              onChange={(e) => update("deviceId", e.target.value)}
              placeholder="例如 SERVER-01"
              disabled={saving}
              autoComplete="off"
            />
            <p className="text-[11px] text-muted-foreground">
              终端激活和签到时使用，建议使用唯一可识别字符串
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="operator">操作员 (operator)</Label>
            <Input
              id="operator"
              value={value.operator}
              onChange={(e) => update("operator", e.target.value)}
              placeholder="例如 system"
              disabled={saving}
              autoComplete="off"
            />
            <p className="text-[11px] text-muted-foreground">
              下单时上送的操作员标识，便于在收钱吧账单中追溯
            </p>
          </div>
        </div>

        {/* 终端激活/签到操作区 */}
        <div className="mt-6 flex flex-col gap-3 rounded-lg border border-dashed border-border bg-background/40 p-4">
          <div className="flex items-start gap-3">
            <Server className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">终端管理</p>
              <p className="text-[11px] text-muted-foreground">
                首次接入需用激活码激活终端，每日首次下单前需要签到以更新终端密钥。配置发生变更后请保存再操作。
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActivateOpen(true)}
              disabled={saving || activating || checkingIn}
            >
              <KeyRound className="mr-1.5 h-3.5 w-3.5" />
              激活终端
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCheckin}
              disabled={
                saving ||
                activating ||
                checkingIn ||
                !value.terminalSn ||
                !value.terminalKey ||
                !value.deviceId
              }
            >
              {checkingIn ? (
                <Spinner className="mr-1.5 h-3.5 w-3.5" />
              ) : (
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              )}
              {checkingIn ? "签到中..." : "手动签到"}
            </Button>
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

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="callback-public-key">回调公钥 (callback_public_key)</Label>
            <Textarea
              id="callback-public-key"
              value={value.callbackPublicKey}
              onChange={(e) => update("callbackPublicKey", e.target.value)}
              placeholder={
                "-----BEGIN PUBLIC KEY-----\n…\n-----END PUBLIC KEY-----"
              }
              disabled={saving}
              autoComplete="off"
              rows={5}
              className="resize-y font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              收钱吧异步通知签名验证使用的公钥，可留空（默认使用 terminal_key 进行 MD5 校验）
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

      <Dialog open={activateOpen} onOpenChange={(v) => !activating && setActivateOpen(v)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>激活终端</DialogTitle>
            <DialogDescription>
              使用收钱吧商户后台生成的激活码完成终端激活，激活成功后会自动写回 terminal_sn 和
              terminal_key
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="activate-code">激活码 (code)</Label>
              <Input
                id="activate-code"
                value={activateCode}
                onChange={(e) => setActivateCode(e.target.value)}
                placeholder="收钱吧后台生成的激活码"
                disabled={activating}
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="activate-device">设备 ID</Label>
              <Input
                id="activate-device"
                value={value.deviceId}
                onChange={(e) => update("deviceId", e.target.value)}
                placeholder="必填，唯一标识"
                disabled={activating}
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="activate-name">终端名称（可选）</Label>
              <Input
                id="activate-name"
                value={activateName}
                onChange={(e) => setActivateName(e.target.value)}
                placeholder="便于在收钱吧后台识别"
                disabled={activating}
                autoComplete="off"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setActivateOpen(false)}
              disabled={activating}
            >
              取消
            </Button>
            <Button type="button" onClick={handleActivate} disabled={activating}>
              {activating ? <Spinner className="mr-2 h-4 w-4" /> : null}
              {activating ? "激活中..." : "开始激活"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
