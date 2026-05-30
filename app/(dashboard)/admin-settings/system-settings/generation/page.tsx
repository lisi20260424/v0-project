import { GenerationConfigForm } from "@/components/admin/generation-config-form"

export const dynamic = "force-dynamic"
export const metadata = { title: "生成配置 | 系统设置" }

export default async function GenerationSettingsPage() {
  return <div className="flex flex-col gap-6"><div><h2 className="text-lg font-semibold">生成配置</h2><p className="mt-1 text-xs text-muted-foreground">配置将通过 Go API `/v1/admin/generation-config` 保存。</p></div><GenerationConfigForm initialMusicTimeout={600} initialImageTimeout={300} initialVideoTimeout={1800} updatedAt={null} /></div>
}
