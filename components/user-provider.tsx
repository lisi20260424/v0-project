"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { platformAPI } from "@/lib/platform-api"
import { clearPlatformSession, getPlatformSession } from "@/lib/platform-session"

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
  setUserFromApi: (raw: any) => void
}

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  isAdmin: false,
  refreshUser: async () => {},
  setUserFromApi: () => {},
})

function normalizeUser(raw: any): NonNullable<CurrentUser> {
  const email = raw?.email ?? ""
  const userType = (raw?.userType ?? raw?.user_type ?? (raw?.role === "admin" ? "admin" : "normal")) as
    | "normal"
    | "admin"

  return {
    id: raw?.id ?? email,
    email,
    displayName: raw?.displayName ?? raw?.display_name ?? email.split("@")[0] ?? "User",
    avatarUrl: raw?.avatarUrl ?? raw?.avatar_url ?? null,
    points: raw?.points ?? 0,
    vipTier: (raw?.vipTier ?? raw?.vip_tier ?? null) as "monthly" | "annual" | "lifetime" | null,
    status: (raw?.status ?? "active") as "active" | "suspended" | "banned",
    userType,
  }
}

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

  const setUserFromApi = useCallback((raw: any) => {
    const userData = normalizeUser(raw)
    setUser(userData)
    setIsAdmin(userData.userType === "admin")
  }, [])

  const refreshUser = useCallback(async () => {
    const session = getPlatformSession()
    if (!session?.accessToken) {
      setUser(null)
      setIsAdmin(false)
      return
    }

    try {
      const res = await platformAPI.me(session.accessToken)
      setUserFromApi(res.data ?? res)
    } catch (error) {
      console.error("[v0] Failed to refresh user:", error)
      clearPlatformSession()
      setUser(null)
      setIsAdmin(false)
    }
  }, [setUserFromApi])

  useEffect(() => {
    setLoading(true)
    refreshUser().finally(() => setLoading(false))
  }, [refreshUser])

  useEffect(() => {
    const interval = setInterval(() => {
      refreshUser()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [refreshUser])

  return (
    <UserContext.Provider value={{ user, loading, isAdmin, refreshUser, setUserFromApi }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
