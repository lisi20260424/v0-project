import { GatewayForm } from "@/components/admin/gateway-form"

export const dynamic = "force-dynamic"
export const metadata = { title: "API 网关 | 系统设置" }

export default async function GatewaySettingsPage() {
  return <div className="flex flex-col gap-6"><div><h2 className="text-lg font-semibold">API 网关</h2><p className="mt-1 text-xs text-muted-foreground">配置将通过 Go API `/v1/admin/gateway` 保存。</p></div><GatewayForm initialApiKey="" initialGatewayUrl="" updatedAt={null} /></div>
}
