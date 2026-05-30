import { createAdminClient } from "@/lib/supabase/admin"
import { GenerationConfigForm } from "@/components/admin/generation-config-form"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "生成配置 · 系统设置",
}

export default async function GenerationSettingsPage() {
  const admin = createAdminClient()
  const { data } = await admin
    .from("admin_generation_config")
    .select("music_timeout, image_timeout, video_timeout, updated_at")
    .eq("id", 1)
    .maybeSingle()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">生成配置</h2>
        <p className="text-xs text-muted-foreground">
          配置音乐、图像、视频生成任务的最大执行时间
        </p>
      </div>
      <GenerationConfigForm
        initialMusicTimeout={data?.music_timeout ?? 600}
        initialImageTimeout={data?.image_timeout ?? 300}
        initialVideoTimeout={data?.video_timeout ?? 1800}
        updatedAt={data?.updated_at ?? null}
      />
    </div>
  )
}
