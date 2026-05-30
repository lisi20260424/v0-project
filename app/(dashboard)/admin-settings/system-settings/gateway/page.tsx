import { createAdminClient } from "@/lib/supabase/admin"
import { GatewayForm } from "@/components/admin/gateway-form"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "API 网关 · 系统设置",
}

export default async function GatewaySettingsPage() {
  const admin = createAdminClient()
  const { data } = await admin
    .from("admin_gateway_settings")
    .select("api_key, gateway_url, updated_at")
    .eq("id", 1)
    .maybeSingle()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">API 网关</h2>
        <p className="text-xs text-muted-foreground">
          所有平台模型调用都会经过该网关地址，并使用下方密钥鉴权
        </p>
      </div>
      <GatewayForm
        initialApiKey={data?.api_key ?? ""}
        initialGatewayUrl={data?.gateway_url ?? ""}
        updatedAt={data?.updated_at ?? null}
      />
    </div>
  )
}
