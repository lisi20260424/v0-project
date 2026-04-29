import { createAdminClient } from "@/lib/supabase/admin"
import { SystemSettingsPageContent } from "@/components/system-settings-content"

export const dynamic = "force-dynamic"

export default async function SystemSettingsPage() {
  const admin = createAdminClient()

  const [{ data: gatewayData }, { data: generationData }, { data: paymentData }] = await Promise.all([
    admin
      .from("admin_gateway_settings")
      .select("api_key, gateway_url, updated_at")
      .eq("id", 1)
      .maybeSingle(),
    admin
      .from("admin_generation_config")
      .select("music_timeout, image_timeout, video_timeout, updated_at")
      .eq("id", 1)
      .maybeSingle(),
    admin
      .from("admin_payment_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle(),
  ])

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
    payment: {
      enabled: paymentData?.enabled ?? false,
      vendorSn: paymentData?.vendor_sn ?? "",
      vendorKey: paymentData?.vendor_key ?? "",
      appId: paymentData?.app_id ?? "",
      terminalSn: paymentData?.terminal_sn ?? "",
      terminalKey: paymentData?.terminal_key ?? "",
      notifyUrl: paymentData?.notify_url ?? "",
      returnUrl: paymentData?.return_url ?? "",
      gatewayUrl: paymentData?.gateway_url ?? "",
      testMode: paymentData?.test_mode ?? true,
      updatedAt: paymentData?.updated_at ?? null,
    },
  }

  return <SystemSettingsPageContent data={data} />
}
