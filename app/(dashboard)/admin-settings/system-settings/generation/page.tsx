import { GenerationConfigForm } from "@/components/admin/generation-config-form"
export const dynamic = "force-dynamic"
export const metadata = { title: "生成配置 · 系统设置" }
export default async function GenerationSettingsPage() {
  return <div className="flex flex-col gap-6"><div className="flex flex-col gap-1"><h2 className="text-lg font-semibold">生成配置</h2><p className="text-xs text-muted-foreground">配置音乐、图像、视频生成任务的最大执行时间</p></div><GenerationConfigForm initialMusicTimeout={600} initialImageTimeout={300} initialVideoTimeout={1800} updatedAt={null} /></div>
}
