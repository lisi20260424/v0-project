import { createAdminClient } from "@/lib/supabase/admin"
import { GatewayForm } from "@/components/admin/gateway-form"

export const dynamic = "force-dynamic"

export default async function AdminGatewayPage() {
  const admin = createAdminClient()
  const { data } = await admin
    .from("admin_gateway_settings")
    .select("api_key, gateway_url, updated_at")
    .eq("id", 1)
    .maybeSingle()

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight">API 网关</h1>
        <p className="text-sm text-muted-foreground">
          配置统一调用 AI 模型的网关地址与访问密钥，所有模型调用都会经过此网关。
        </p>
      </header>

      <GatewayForm
        initialApiKey={data?.api_key ?? ""}
        initialGatewayUrl={data?.gateway_url ?? ""}
        updatedAt={data?.updated_at ?? null}
      />
    </div>
  )
}
