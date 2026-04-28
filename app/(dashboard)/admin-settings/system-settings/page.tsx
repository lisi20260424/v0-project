import { createAdminClient } from "@/lib/supabase/admin"
import { SystemSettingsPageContent } from "@/components/system-settings-content"

export const dynamic = "force-dynamic"

export default async function SystemSettingsPage() {
  const admin = createAdminClient()

  // 获取网关配置
  const { data: gatewayData } = await admin
    .from("admin_gateway_settings")
    .select("api_key, gateway_url, updated_at")
    .eq("id", 1)
    .maybeSingle()

  // 获取生成配置 (若不存在则使用默认值)
  const { data: generationData } = await admin
    .from("admin_generation_config")
    .select("music_timeout, image_timeout, video_timeout, updated_at")
    .eq("id", 1)
    .maybeSingle()

  const data = {
    gateway: {
      api_key: gatewayData?.api_key ?? "",
      gateway_url: gatewayData?.gateway_url ?? "",
      updated_at: gatewayData?.updated_at ?? null,
    },
    generation: {
      music_timeout: generationData?.music_timeout ?? 600,
      image_timeout: generationData?.image_timeout ?? 300,
      video_timeout: generationData?.video_timeout ?? 1800,
      updated_at: generationData?.updated_at ?? null,
    },
  }

  return <SystemSettingsPageContent data={data} />
}
