"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Eye, EyeOff, Plug } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { API_BASE_URL } from "@/lib/platform-api"

type Props = {
  initialApiKey: string
  initialGatewayUrl: string
  updatedAt: string | null
}

type GatewayResponse = {
  apiKey?: string
  gatewayUrl?: string
  updatedAt?: string | null
}

export function GatewayForm({ initialApiKey, initialGatewayUrl, updatedAt: initialUpdatedAt }: Props) {
  const [apiKey, setApiKey] = useState(initialApiKey)
  const [gatewayUrl, setGatewayUrl] = useState(initialGatewayUrl)
  const [updatedAt, setUpdatedAt] = useState<string | null>(initialUpdatedAt)
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("accessToken") ?? ""
    if (!token) return

    setLoading(true)
    fetch(`${API_BASE_URL}/v1/admin/gateway`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? "Failed to load gateway settings")
        const data = json.data as GatewayResponse
        setApiKey(data.apiKey ?? "")
        setGatewayUrl(data.gatewayUrl ?? "")
        setUpdatedAt(data.updatedAt ?? null)
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load gateway settings"))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    try {
      const token = localStorage.getItem("accessToken") ?? ""
      const res = await fetch(`${API_BASE_URL}/v1/admin/gateway`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ apiKey, gatewayUrl }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to save gateway settings")
      const data = json.data as GatewayResponse
      setApiKey(data.apiKey ?? apiKey)
      setGatewayUrl(data.gatewayUrl ?? gatewayUrl)
      setUpdatedAt(data.updatedAt ?? new Date().toISOString())
      toast.success("Gateway settings saved")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save gateway settings")
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    setTesting(true)
    try {
      const token = localStorage.getItem("accessToken") ?? ""
      const res = await fetch(`${API_BASE_URL}/v1/admin/gateway/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ apiKey, gatewayUrl }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.message ?? json.error ?? "Connection test failed")
      toast.success(`Connection ok (${json.latency ?? 0} ms)`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Connection test failed")
    } finally {
      setTesting(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5">
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-semibold">Gateway credentials</h2>
          <p className="text-xs text-muted-foreground">All model calls use this gateway endpoint and API key.</p>
        </div>

        <div className="mt-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gateway-url">Gateway URL</Label>
            <Input id="gateway-url" type="url" placeholder="https://api.example.com/v1" value={gatewayUrl} onChange={(e) => setGatewayUrl(e.target.value)} disabled={saving || loading} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="api-key">API key</Label>
            <div className="relative">
              <Input id="api-key" type={showKey ? "text" : "password"} placeholder="sk-..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} disabled={saving || loading} autoComplete="off" className="pr-10" />
              <button type="button" onClick={() => setShowKey((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label={showKey ? "Hide key" : "Show key"}>
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{loading ? "Loading settings..." : updatedAt ? `Last updated: ${new Date(updatedAt).toLocaleString("zh-CN")}` : "Not configured"}</p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={handleTest} disabled={testing || !gatewayUrl || loading}>
            {testing ? <Spinner className="mr-2 h-4 w-4" /> : <Plug className="mr-2 h-4 w-4" />}
            {testing ? "Testing..." : "Test gateway"}
          </Button>
          <Button type="submit" disabled={saving || loading}>
            {saving ? <Spinner className="mr-2 h-4 w-4" /> : null}
            {saving ? "Saving..." : "Save settings"}
          </Button>
        </div>
      </div>
    </form>
  )
}
