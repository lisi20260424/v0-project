import { ModelsManager } from "@/components/admin/models-manager"

export const dynamic = "force-dynamic"

export default async function AdminModelsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight">模型配置</h1>
        <p className="text-sm text-muted-foreground">
          管理平台可用的 AI 模型，包含视频、图像、音乐三类。配置后会在对应生成页面中可选。
        </p>
      </header>
      <ModelsManager initialModels={[]} />
    </div>
  )
}
