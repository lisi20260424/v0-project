import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProfileForm } from "@/components/settings/profile-form"

export const metadata = {
  title: "个人资料 · 账户设置",
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login?next=/settings/profile")

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, bio, location, website")
    .eq("id", user.id)
    .maybeSingle()

  return (
    <ProfileForm
      initial={{
        id: user.id,
        email: user.email ?? "",
        displayName: profile?.display_name ?? (user.user_metadata?.display_name as string) ?? "",
        avatarUrl: profile?.avatar_url ?? "",
        bio: profile?.bio ?? "",
        location: profile?.location ?? "",
        website: profile?.website ?? "",
      }}
    />
  )
}
