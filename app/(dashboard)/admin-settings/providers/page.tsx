import { ProvidersManager } from "@/components/admin/providers-manager"

export const dynamic = "force-dynamic"

export default async function ProvidersPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight">供应商配置</h1>
        <p className="text-sm text-muted-foreground">
          管理 AI 模型供应商，配置后可在模型配置中选择使用。
        </p>
      </header>
      <ProvidersManager initialProviders={[]} />
    </div>
  )
}
