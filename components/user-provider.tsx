"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

export type CurrentUser = {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
  points: number
  vipTier: "monthly" | "annual" | "lifetime" | null
  status: "active" | "suspended" | "banned"
  userType: "normal" | "admin"
} | null

type UserContextValue = {
  user: CurrentUser
  loading: boolean
  isAdmin: boolean
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  isAdmin: false,
  refreshUser: async () => {},
})

export function UserProvider({
  initialUser,
  initialIsAdmin = false,
  children,
}: {
  initialUser: CurrentUser
  initialIsAdmin?: boolean
  children: React.ReactNode
}) {
  const [user, setUser] = useState<CurrentUser>(initialUser)
  const [isAdmin, setIsAdmin] = useState<boolean>(initialIsAdmin)
  const [loading, setLoading] = useState(false)
  const supabaseRef = createClient()
  let unsubscribeRef: (() => void) | null = null

  // 刷新用户信息，同时处理会话过期
  const refreshUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabaseRef.auth.getSession()
      
      if (!session?.user) {
        setUser(null)
        setIsAdmin(false)
        return
      }

      // 检查并刷新令牌
      const { data, error } = await supabaseRef.auth.refreshSession()
      if (error || !data.session) {
        setUser(null)
        setIsAdmin(false)
        return
      }

      const { data: profile } = await supabaseRef
        .from("profiles")
        .select("display_name, avatar_url, points, vip_tier, status, user_type")
        .eq("id", session.user.id)
        .maybeSingle()

      const userData = {
        id: session.user.id,
        email: session.user.email ?? "",
        displayName:
          profile?.display_name ??
          (session.user.user_metadata?.display_name as string) ??
          (session.user.email?.split("@")[0] ?? "用户"),
        avatarUrl: profile?.avatar_url ?? null,
        points: profile?.points ?? 0,
        vipTier:
          (profile?.vip_tier as CurrentUser extends infer U ? (U extends null ? never : U["vipTier"]) : never) ?? null,
        status: (profile?.status ?? "active") as "active" | "suspended" | "banned",
        userType: (profile?.user_type ?? "normal") as "normal" | "admin",
      }

      setUser(userData)
      setIsAdmin(userData.userType === "admin")
    } catch (error) {
      console.error("[v0] Failed to refresh user:", error)
      setUser(null)
      setIsAdmin(false)
    }
  }, [])

  // 设置认证状态变化监听器
  useEffect(() => {
    setLoading(true)
    
    const { data: subscription } = supabaseRef.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setUser(null)
        setIsAdmin(false)
        setLoading(false)
        return
      }

      try {
        const { data: profile } = await supabaseRef
          .from("profiles")
          .select("display_name, avatar_url, points, vip_tier, status, user_type")
          .eq("id", session.user.id)
          .maybeSingle()

        const userData = {
          id: session.user.id,
          email: session.user.email ?? "",
          displayName:
            profile?.display_name ??
            (session.user.user_metadata?.display_name as string) ??
            (session.user.email?.split("@")[0] ?? "用户"),
          avatarUrl: profile?.avatar_url ?? null,
          points: profile?.points ?? 0,
          vipTier:
            (profile?.vip_tier as CurrentUser extends infer U ? (U extends null ? never : U["vipTier"]) : never) ?? null,
          status: (profile?.status ?? "active") as "active" | "suspended" | "banned",
          userType: (profile?.user_type ?? "normal") as "normal" | "admin",
        }

        setUser(userData)
        setIsAdmin(userData.userType === "admin")
      } catch (error) {
        console.error("[v0] Auth state change error:", error)
        setUser(null)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    })

    unsubscribeRef = subscription.subscription.unsubscribe

    return () => {
      if (unsubscribeRef) {
        unsubscribeRef()
      }
    }
  }, [])

  // 定期检查会话是否有效（每 5 分钟检查一次）
  useEffect(() => {
    const interval = setInterval(() => {
      refreshUser()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [refreshUser])

  return (
    <UserContext.Provider value={{ user, loading, isAdmin, refreshUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
