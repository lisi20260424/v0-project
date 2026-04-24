import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PreferencesForm } from "@/components/settings/preferences-form"

export const metadata = {
  title: "偏好设置 · 账户设置",
}

export default async function PreferencesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login?next=/settings/preferences")

  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("default_video_model, default_image_model, default_ratio, language, theme, notify_email, notify_sms, notify_inbox")
    .eq("user_id", user.id)
    .maybeSingle()

  return (
    <PreferencesForm
      initial={{
        userId: user.id,
        defaultVideoModel: prefs?.default_video_model ?? "veo3.1-fast",
        defaultImageModel: prefs?.default_image_model ?? "nano-banana",
        defaultRatio: prefs?.default_ratio ?? "9:16",
        language: prefs?.language ?? "zh-CN",
        theme: prefs?.theme ?? "dark",
        notifyEmail: prefs?.notify_email ?? true,
        notifySms: prefs?.notify_sms ?? false,
        notifyInbox: prefs?.notify_inbox ?? true,
      }}
    />
  )
}
