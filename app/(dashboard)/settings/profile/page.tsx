import { ProfileForm } from "@/components/settings/profile-form"

export const metadata = { title: "个人资料 | 账户设置" }

export default async function ProfilePage() {
  return <ProfileForm initial={{ id: "local", email: "", displayName: "用户", avatarUrl: "", bio: "", location: "", website: "" }} />
}
