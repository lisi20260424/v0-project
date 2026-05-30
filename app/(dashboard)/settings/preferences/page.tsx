import { PreferencesForm } from "@/components/settings/preferences-form"

export const metadata = { title: "偏好设置 | 账户设置" }

export default async function PreferencesPage() {
  return <PreferencesForm initial={{ userId: "local", defaultVideoModel: "model_veo_video", defaultImageModel: "model_gpt_image", defaultRatio: "16:9", language: "zh-CN", theme: "light", notifyEmail: true, notifySms: false, notifyInbox: true }} />
}
