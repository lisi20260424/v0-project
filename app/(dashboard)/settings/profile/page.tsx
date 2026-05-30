import { ProfileForm } from "@/components/settings/profile-form"

export const metadata = {
  title: "个人资料 · 账户设置",
}

export default async function ProfilePage() {
  return (
    <ProfileForm
      initial={{
        id: "",
        email: "",
        displayName: "",
        avatarUrl: "",
        bio: "",
        location: "",
        website: "",
      }}
    />
  )
}
