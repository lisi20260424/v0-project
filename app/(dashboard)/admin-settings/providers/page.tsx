import { getPublicProviders } from "@/lib/public-catalog"
import { ProvidersManager, type AdminProvider } from "@/components/admin/providers-manager"

export const dynamic = "force-dynamic"

export default async function ProvidersPage() {
  const data = await getPublicProviders()
  return <div className="space-y-6"><header><h1 className="text-2xl font-bold tracking-tight">供应商配置</h1><p className="mt-1 text-sm text-muted-foreground">当前读取 Go API 公开供应商配置。</p></header><ProvidersManager initialProviders={data as AdminProvider[]} /></div>
}
