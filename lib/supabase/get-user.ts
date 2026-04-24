import { createClient } from "@/lib/supabase/server"
import type { CurrentUser } from "@/components/user-provider"

export async function getCurrentUser(): Promise<CurrentUser> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, points, vip_tier")
    .eq("id", user.id)
    .maybeSingle()

  return {
    id: user.id,
    email: user.email ?? "",
    displayName:
      profile?.display_name ??
      (user.user_metadata?.display_name as string) ??
      (user.email?.split("@")[0] ?? "用户"),
    avatarUrl: profile?.avatar_url ?? null,
    points: profile?.points ?? 0,
    vipTier: (profile?.vip_tier as "monthly" | "annual" | "lifetime" | null) ?? null,
  }
}
