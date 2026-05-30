"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
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

function rowToValue(row: any, prev: PaymentSettingsValue): PaymentSettingsValue {
  return {
    enabled: row.enabled ?? prev.enabled,
    vendorSn: row.vendor_sn ?? prev.vendorSn,
    vendorKey: row.vendor_key ?? prev.vendorKey,
    appId: row.app_id ?? prev.appId,
    terminalSn: row.terminal_sn ?? prev.terminalSn,
    terminalKey: row.terminal_key ?? prev.terminalKey,
    deviceId: row.device_id ?? prev.deviceId,
    operator: row.operator ?? prev.operator,
    notifyUrl: row.notify_url ?? prev.notifyUrl,
    returnUrl: row.return_url ?? prev.returnUrl,
    gatewayUrl: row.gateway_url ?? prev.gatewayUrl,
    callbackPublicKey: row.callback_public_key ?? prev.callbackPublicKey,
    testMode: row.test_mode ?? prev.testMode,
    updatedAt: row.updated_at ?? prev.updatedAt,
  }
}

export function PaymentForm({ initialValue }: Props) {
  const [value, setValue] = useState<PaymentSettingsValue>(initialValue)
  const [showVendorKey, setShowVendorKey] = useState(false)
  const [showTerminalKey, setShowTerminalKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activating, setActivating] = useState(false)
  const [activateOpen, setActivateOpen] = useState(false)
  const [activateCode, setActivateCode] = useState("")
  const [activateName, setActivateName] = useState("")
  const [checkingIn, setCheckingIn] = useState(false)

  function update<K extends keyof PaymentSettingsValue>(
    key: K,
    v: PaymentSettingsValue[K],
  ) {
    setValue((prev) => ({ ...prev, [key]: v }))
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/admin/payment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "保存失败")
      setValue((prev) => rowToValue(json.data, prev))
      toast.success("支付配置已更新")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败")
    } finally {
      setSaving(false)
    }
  }

  async function handleActivate() {
    if (!activateCode.trim()) {
      toast.error("请填写激活码")
      return
    }
    setActivating(true)
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

      const contentType = res.headers.get("content-type")
      if (!contentType?.includes("application/json")) {
        const text = await res.text()
        console.error("[v0] Non-JSON response:", text.slice(0, 200))
        throw new Error(`服务器返回非 JSON 响应（HTTP ${res.status}），请检查网络或服务器状态`)
      }

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error ?? `激活失败（HTTP ${res.status}）`)
      }
      if (!json.ok) {
        throw new Error(json.error ?? "激活失败")
      }

      const latest = await fetch("/api/admin/payment", { cache: "no-store" })
      if (!latest.ok) {
        throw new Error("获取最新配置失败")
      }
      const latestJson = await latest.json()
      setValue((prev) => rowToValue(latestJson.data, prev))

      setActivateOpen(false)
      setActivateCode("")
      setActivateName("")
      toast.success("终端激活成功，已更新终端凭证")
    } catch (err) {
      console.error("[v0] Activate error:", err)
      toast.error(err instanceof Error ? err.message : "激活失败")
    } finally {
      setActivating(false)
    }
  }

  async function handleCheckin() {
    setCheckingIn(true)
    try {
      const res = await fetch("/api/admin/payment/checkin", { method: "POST" })

      const contentType = res.headers.get("content-type")
      if (!contentType?.includes("application/json")) {
        const text = await res.text()
        console.error("[v0] Non-JSON response:", text.slice(0, 200))
        throw new Error(`服务器返回非 JSON 响应（HTTP ${res.status}），请检查网络或服务器状态`)
      }

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error ?? `签到失败（HTTP ${res.status}）`)
      }
      if (!json.ok) {
        throw new Error(json.error ?? "签到失败")
      }

      const latest = await fetch("/api/admin/payment", { cache: "no-store" })
      if (!latest.ok) {
        throw new Error("获取最新配置失败")
      }
      const latestJson = await latest.json()
      setValue((prev) => rowToValue(latestJson.data, prev))

      toast.success(json.message ?? "签到成功")
    } catch (err) {
      console.error("[v0] Checkin error:", err)
      toast.error(err instanceof Error ? err.message : "签到失败")
    } finally {
      setCheckingIn(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">支付配置</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">收钱吧聚合支付配置</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={value.enabled} onCheckedChange={(v) => update("enabled", v)} disabled={saving} />
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-border/50 bg-background/40 p-4">
          <h4 className="text-sm font-medium">商户凭证</h4>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="vendor-sn">服务商代码 (vendor_sn)</Label>
            <Input
              id="vendor-sn"
              value={value.vendorSn}
              onChange={(e) => update("vendorSn", e.target.value)}
              placeholder="收钱吧后台服务商 SN"
              disabled={saving}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="vendor-key">服务商密钥 (vendor_key)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="vendor-key"
                type={showVendorKey ? "text" : "password"}
                value={value.vendorKey}
                onChange={(e) => update("vendorKey", e.target.value)}
                placeholder="收钱吧后台服务商 KEY"
                disabled={saving}
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowVendorKey(!showVendorKey)}
                disabled={saving}
              >
                {showVendorKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="app-id">应用 ID (app_id)</Label>
            <Input
              id="app-id"
              value={value.appId}
              onChange={(e) => update("appId", e.target.value)}
              placeholder="应用唯一标识"
              disabled={saving}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="device-id">设备 ID (device_id)</Label>
            <Input
              id="device-id"
              value={value.deviceId}
              onChange={(e) => update("deviceId", e.target.value)}
              placeholder="设备唯一标识"
              disabled={saving}
            />
            <p className="text-[11px] text-muted-foreground">激活时需要，建议填写服务器 ID 或机器码</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="operator">操作员 (operator)</Label>
            <Input
              id="operator"
              value={value.operator}
              onChange={(e) => update("operator", e.target.value)}
              placeholder="默认使用用户邮箱"
              disabled={saving}
            />
            <p className="text-[11px] text-muted-foreground">创建订单时使用，留空则自动使用管理员邮箱</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="terminal-sn">终端 SN (terminal_sn) - 只读</Label>
            <Input id="terminal-sn" value={value.terminalSn} readOnly className="bg-muted text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground">激活终端后自动获取</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="terminal-key">终端密钥 (terminal_key) - 只读</Label>
            <div className="flex items-center gap-2">
              <Input
                id="terminal-key"
                type={showTerminalKey ? "text" : "password"}
                value={value.terminalKey}
                readOnly
                className="bg-muted text-muted-foreground"
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowTerminalKey(!showTerminalKey)}
              >
                {showTerminalKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">激活或签到后自动更新</p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActivateOpen(true)}
              disabled={saving || !value.deviceId}
            >
              <KeyRound className="mr-2 h-4 w-4" />
              激活终端
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCheckin}
              disabled={saving || checkingIn || !value.terminalSn || !value.terminalKey}
            >
              {checkingIn ? <Spinner className="mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              {checkingIn ? "签到中..." : "手动签到"}
            </Button>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-border/50 bg-background/40 p-4">
          <h4 className="text-sm font-medium">网关与回调</h4>

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
              placeholder="-----BEGIN PUBLIC KEY-----\n…\n-----END PUBLIC KEY-----"
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {value.updatedAt ? `上次更新：${new Date(value.updatedAt).toLocaleString("zh-CN")}` : "尚未配置"}
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
              使用收钱吧商户后台生成的激活码完成终端激活，激活成功后会自动写回 terminal_sn 和 terminal_key
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
            <Button type="button" variant="outline" onClick={() => setActivateOpen(false)} disabled={activating}>
              取消
            </Button>
            <Button type="button" onClick={handleActivate} disabled={activating}>
              {activating ? <Spinner className="mr-2 h-4 w-4" /> : null}
              {activating ? "激活中..." : "确认激活"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
