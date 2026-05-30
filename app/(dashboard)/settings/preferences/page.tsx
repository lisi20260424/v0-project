import { PreferencesForm } from "@/components/settings/preferences-form"

export const metadata = {
  title: "偏好设置 · 账户设置",
}

export default async function PreferencesPage() {
  return (
    <PreferencesForm
      initial={{
        userId: "",
        defaultVideoModel: "veo3.1-fast",
        defaultImageModel: "nano-banana",
        defaultRatio: "9:16",
        language: "zh-CN",
        theme: "dark",
        notifyEmail: true,
        notifySms: false,
        notifyInbox: true,
      }}
    />
  )
}
