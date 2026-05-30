"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Eye, EyeOff, KeyRound, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { API_BASE_URL } from "@/lib/platform-api"

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

type PaymentSettingsRow = Partial<Record<string, any>>

function rowToValue(row: PaymentSettingsRow | undefined, prev: PaymentSettingsValue): PaymentSettingsValue {
  const source = row ?? {}
  return {
    enabled: source.enabled ?? prev.enabled,
    vendorSn: source.vendor_sn ?? source.vendorSn ?? prev.vendorSn,
    vendorKey: source.vendor_key ?? source.vendorKey ?? prev.vendorKey,
    appId: source.app_id ?? source.appId ?? prev.appId,
    terminalSn: source.terminal_sn ?? source.terminalSn ?? prev.terminalSn,
    terminalKey: source.terminal_key ?? source.terminalKey ?? prev.terminalKey,
    deviceId: source.device_id ?? source.deviceId ?? prev.deviceId,
    operator: source.operator ?? prev.operator,
    notifyUrl: source.notify_url ?? source.notifyUrl ?? prev.notifyUrl,
    returnUrl: source.return_url ?? source.returnUrl ?? prev.returnUrl,
    gatewayUrl: source.gateway_url ?? source.gatewayUrl ?? prev.gatewayUrl,
    callbackPublicKey: source.callback_public_key ?? source.callbackPublicKey ?? prev.callbackPublicKey,
    testMode: source.test_mode ?? source.testMode ?? prev.testMode,
    updatedAt: source.updated_at ?? source.updatedAt ?? prev.updatedAt,
  }
}

export function PaymentForm({ initialValue }: Props) {
  const [value, setValue] = useState<PaymentSettingsValue>(initialValue)
  const [showVendorKey, setShowVendorKey] = useState(false)
  const [showTerminalKey, setShowTerminalKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activating, setActivating] = useState(false)
  const [activateOpen, setActivateOpen] = useState(false)
  const [activateCode, setActivateCode] = useState("")
  const [activateName, setActivateName] = useState("")
  const [checkingIn, setCheckingIn] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("accessToken") ?? ""
    if (!token) return

    setLoading(true)
    fetch(`${API_BASE_URL}/v1/admin/payment`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? "Failed to load payment settings")
        setValue((prev) => rowToValue(json.data, prev))
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load payment settings"))
      .finally(() => setLoading(false))
  }, [])

  function update<K extends keyof PaymentSettingsValue>(key: K, nextValue: PaymentSettingsValue[K]) {
    setValue((prev) => ({ ...prev, [key]: nextValue }))
  }

  async function fetchLatest(token: string) {
    const latest = await fetch(`${API_BASE_URL}/v1/admin/payment`, {
      cache: "no-store",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    const json = await latest.json()
    if (!latest.ok) throw new Error(json.error ?? "Failed to load latest payment settings")
    setValue((prev) => rowToValue(json.data, prev))
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    try {
      const token = localStorage.getItem("accessToken") ?? ""
      const res = await fetch(`${API_BASE_URL}/v1/admin/payment`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(value),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to save payment settings")
      setValue((prev) => rowToValue(json.data, prev))
      toast.success("Payment settings saved")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save payment settings")
    } finally {
      setSaving(false)
    }
  }

  async function handleActivate() {
    if (!activateCode.trim()) {
      toast.error("Activation code is required")
      return
    }

    setActivating(true)
    try {
      const token = localStorage.getItem("accessToken") ?? ""
      const res = await fetch(`${API_BASE_URL}/v1/admin/payment/activate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          code: activateCode.trim(),
          deviceId: value.deviceId,
          name: activateName.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Activation failed")

      await fetchLatest(token)
      setActivateOpen(false)
      setActivateCode("")
      setActivateName("")
      toast.success("Terminal activated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Activation failed")
    } finally {
      setActivating(false)
    }
  }

  async function handleCheckin() {
    setCheckingIn(true)
    try {
      const token = localStorage.getItem("accessToken") ?? ""
      const res = await fetch(`${API_BASE_URL}/v1/admin/payment/checkin`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Check-in failed")

      await fetchLatest(token)
      toast.success(json.message ?? "Check-in completed")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Check-in failed")
    } finally {
      setCheckingIn(false)
    }
  }

  const busy = loading || saving

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold">Payment provider</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Persisted through the Go API and PostgreSQL admin settings table.</p>
          </div>
          <Switch checked={value.enabled} onCheckedChange={(checked) => update("enabled", checked)} disabled={busy} />
        </div>

        <div className="space-y-4 rounded-lg border border-border/50 bg-background/40 p-4">
          <h4 className="text-sm font-medium">Merchant credentials</h4>
          <TextField id="vendor-sn" label="Vendor SN" value={value.vendorSn} onChange={(v) => update("vendorSn", v)} disabled={busy} />
          <SecretField id="vendor-key" label="Vendor key" value={value.vendorKey} visible={showVendorKey} onToggle={() => setShowVendorKey((v) => !v)} onChange={(v) => update("vendorKey", v)} disabled={busy} />
          <TextField id="app-id" label="App ID" value={value.appId} onChange={(v) => update("appId", v)} disabled={busy} />
          <TextField id="device-id" label="Device ID" value={value.deviceId} onChange={(v) => update("deviceId", v)} disabled={busy} hint="Required when activating a payment terminal." />
          <TextField id="operator" label="Operator" value={value.operator} onChange={(v) => update("operator", v)} disabled={busy} hint="Optional. Defaults to the current admin user when omitted." />
          <TextField id="terminal-sn" label="Terminal SN" value={value.terminalSn} onChange={() => undefined} disabled readOnly />
          <SecretField id="terminal-key" label="Terminal key" value={value.terminalKey} visible={showTerminalKey} onToggle={() => setShowTerminalKey((v) => !v)} onChange={() => undefined} disabled readOnly />

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setActivateOpen(true)} disabled={busy || !value.deviceId}>
              <KeyRound className="mr-2 h-4 w-4" />
              Activate terminal
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleCheckin} disabled={busy || checkingIn || !value.terminalSn || !value.terminalKey}>
              {checkingIn ? <Spinner className="mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              {checkingIn ? "Checking in..." : "Manual check-in"}
            </Button>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-border/50 bg-background/40 p-4">
          <h4 className="text-sm font-medium">Gateway and callbacks</h4>
          <TextField id="gateway-url" label="Payment gateway URL" value={value.gatewayUrl} onChange={(v) => update("gatewayUrl", v)} disabled={busy} placeholder="https://vsi-api.shouqianba.com" />
          <TextField id="notify-url" label="Notify URL" value={value.notifyUrl} onChange={(v) => update("notifyUrl", v)} disabled={busy} placeholder="https://your-domain.com/v1/pay/notify/shouqianba" />
          <TextField id="return-url" label="Return URL" value={value.returnUrl} onChange={(v) => update("returnUrl", v)} disabled={busy} placeholder="https://your-domain.com/billing/result" />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="callback-public-key">Callback public key</Label>
            <Textarea id="callback-public-key" value={value.callbackPublicKey} onChange={(e) => update("callbackPublicKey", e.target.value)} disabled={busy} autoComplete="off" rows={5} className="resize-y font-mono text-xs" placeholder="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----" />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-4 py-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Test mode</span>
              <span className="text-[11px] text-muted-foreground">Use sandbox endpoints where supported.</span>
            </div>
            <Switch checked={value.testMode} onCheckedChange={(checked) => update("testMode", checked)} disabled={busy} />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{loading ? "Loading settings..." : value.updatedAt ? `Last updated: ${new Date(value.updatedAt).toLocaleString("zh-CN")}` : "Not configured"}</p>
        <Button type="submit" disabled={busy}>
          {saving ? <Spinner className="mr-2 h-4 w-4" /> : null}
          {saving ? "Saving..." : "Save settings"}
        </Button>
      </div>

      <Dialog open={activateOpen} onOpenChange={(open) => !activating && setActivateOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Activate terminal</DialogTitle>
            <DialogDescription>Use the activation code generated by the payment provider. Terminal credentials will be refreshed after activation.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <TextField id="activate-code" label="Activation code" value={activateCode} onChange={setActivateCode} disabled={activating} />
            <TextField id="activate-device" label="Device ID" value={value.deviceId} onChange={(v) => update("deviceId", v)} disabled={activating} />
            <TextField id="activate-name" label="Terminal name" value={activateName} onChange={setActivateName} disabled={activating} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setActivateOpen(false)} disabled={activating}>Cancel</Button>
            <Button type="button" onClick={handleActivate} disabled={activating}>
              {activating ? <Spinner className="mr-2 h-4 w-4" /> : null}
              {activating ? "Activating..." : "Confirm activation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}

function TextField({ id, label, value, onChange, disabled, readOnly, placeholder, hint }: { id: string; label: string; value: string; onChange: (value: string) => void; disabled?: boolean; readOnly?: boolean; placeholder?: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} readOnly={readOnly} placeholder={placeholder} className={readOnly ? "bg-muted text-muted-foreground" : undefined} autoComplete="off" />
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function SecretField({ id, label, value, visible, onToggle, onChange, disabled, readOnly }: { id: string; label: string; value: string; visible: boolean; onToggle: () => void; onChange: (value: string) => void; disabled?: boolean; readOnly?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input id={id} type={visible ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} readOnly={readOnly} className={readOnly ? "bg-muted text-muted-foreground" : undefined} autoComplete="off" />
        <Button type="button" size="sm" variant="ghost" onClick={onToggle} disabled={disabled && !readOnly}>
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
