"use client"

import { platformAuthFetch } from "@/lib/platform-session"

import { useState } from "react"
import { toast } from "sonner"
import { Eye, EyeOff, Plug } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"

type Props = {
  initialApiKey: string
  initialGatewayUrl: string
  updatedAt: string | null
}

export function GatewayForm({ initialApiKey, initialGatewayUrl, updatedAt }: Props) {
  const [apiKey, setApiKey] = useState(initialApiKey)
  const [gatewayUrl, setGatewayUrl] = useState(initialGatewayUrl)
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await platformAuthFetch("/v1/admin/gateway", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, gatewayUrl }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "保存失败")
      toast.success("API 网关配置已更新")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败，请稍后重试")
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    setTesting(true)
    try {
      const res = await platformAuthFetch("/v1/admin/gateway/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, gatewayUrl }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.message ?? "连接失败")
      const latency = typeof json.latency === "number" ? json.latency : 0
      toast.success(`连接成功（耗时 ${latency} ms）`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "网络错误")
    } finally {
      setTesting(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5">
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-semibold">网关凭证</h2>
          <p className="text-xs text-muted-foreground">所有平台模型调用都会经过该网关地址，并使用下方密钥鉴权。</p>
        </div>

        <div className="mt-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gateway-url">网关地址</Label>
            <Input
              id="gateway-url"
              type="url"
              placeholder="https://api.example.com/v1"
              value={gatewayUrl}
              onChange={(e) => setGatewayUrl(e.target.value)}
              disabled={saving}
              required
            />
            <p className="text-[11px] text-muted-foreground">
              统一的 AI 模型代理网关，例如自建 OpenAI 兼容网关或 AI Gateway。
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="api-key">访问密钥</Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showKey ? "text" : "password"}
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={saving}
                autoComplete="off"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label={showKey ? "隐藏密钥" : "显示密钥"}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">用于鉴权的 Bearer Token，仅服务端读取，不会下发到浏览器。</p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {updatedAt ? `上次更新：${new Date(updatedAt).toLocaleString("zh-CN")}` : "尚未配置"}
        </p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={handleTest} disabled={testing || !gatewayUrl}>
            {testing ? <Spinner className="mr-2 h-4 w-4" /> : <Plug className="mr-2 h-4 w-4" />}
            {testing ? "测试中..." : "测试网关"}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Spinner className="mr-2 h-4 w-4" /> : null}
            {saving ? "保存中..." : "保存配置"}
          </Button>
        </div>
      </div>
    </form>
  )
}
