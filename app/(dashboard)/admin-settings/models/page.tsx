import { getPublicModels } from "@/lib/public-catalog"
import { ModelsManager, type AdminModel } from "@/components/admin/models-manager"

export const dynamic = "force-dynamic"

export default async function AdminModelsPage() {
  const data = await getPublicModels()
  return <div className="flex flex-col gap-6"><header><h1 className="text-2xl font-bold tracking-tight">模型配置</h1><p className="mt-1 text-sm text-muted-foreground">模型配置由 Go API 读取并持久化到 PostgreSQL。</p></header><ModelsManager initialModels={data as AdminModel[]} /></div>
}
