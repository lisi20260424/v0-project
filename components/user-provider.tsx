"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export type CurrentUser = {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
  points: number
  vipTier: "monthly" | "annual" | "lifetime" | null
} | null

const UserContext = createContext<{ user: CurrentUser; loading: boolean }>({
  user: null,
  loading: true,
})

export function UserProvider({
  initialUser,
  children,
}: {
  initialUser: CurrentUser
  children: React.ReactNode
}) {
  const [user, setUser] = useState<CurrentUser>(initialUser)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setUser(null)
        return
      }
      setLoading(true)
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, points, vip_tier")
        .eq("id", session.user.id)
        .maybeSingle()

      setUser({
        id: session.user.id,
        email: session.user.email ?? "",
        displayName:
          profile?.display_name ??
          (session.user.user_metadata?.display_name as string) ??
          (session.user.email?.split("@")[0] ?? "用户"),
        avatarUrl: profile?.avatar_url ?? null,
        points: profile?.points ?? 0,
        vipTier: (profile?.vip_tier as CurrentUser extends infer U ? U extends null ? never : U["vipTier"] : never) ?? null,
      })
      setLoading(false)
    })

    return () => {
      subscription.subscription.unsubscribe()
    }
  }, [])

  return <UserContext.Provider value={{ user, loading }}>{children}</UserContext.Provider>
}

export function useUser() {
  return useContext(UserContext)
}
