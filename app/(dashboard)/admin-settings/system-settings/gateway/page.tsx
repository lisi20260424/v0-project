import { GatewayForm } from "@/components/admin/gateway-form"
export const dynamic = "force-dynamic"
export const metadata = { title: "API 网关 · 系统设置" }
export default async function GatewaySettingsPage() {
  return <div className="flex flex-col gap-6"><div className="flex flex-col gap-1"><h2 className="text-lg font-semibold">API 网关</h2><p className="text-xs text-muted-foreground">所有平台模型调用都会经过该网关地址，并使用下方密钥鉴权</p></div><GatewayForm initialApiKey="" initialGatewayUrl="" updatedAt={null} /></div>
}
