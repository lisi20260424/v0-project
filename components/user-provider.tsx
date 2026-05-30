"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { platformAPI } from "@/lib/platform-api"

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

function normalizeUser(payload: any): NonNullable<CurrentUser> {
  const role = payload.role ?? payload.userType ?? payload.user_type
  const email = String(payload.email ?? payload.id ?? "")
  const displayName = String(
    payload.displayName ?? payload.display_name ?? (email ? email.split("@")[0] : "User"),
  )

  return {
    id: String(payload.id ?? email),
    email,
    displayName,
    avatarUrl: payload.avatarUrl ?? payload.avatar_url ?? null,
    points: Number(payload.points ?? 0),
    vipTier: (payload.vipTier ?? payload.vip_tier ?? null) as NonNullable<CurrentUser>["vipTier"],
    status: (payload.status ?? "active") as NonNullable<CurrentUser>["status"],
    userType: (role === "admin" ? "admin" : "normal") as NonNullable<CurrentUser>["userType"],
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
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("accessToken") ?? ""
      if (!token) {
        setUser(null)
        setIsAdmin(false)
        return
      }

      const json = await platformAPI.me(token)
      const nextUser = normalizeUser(json.data ?? json)
      setUser(nextUser)
      setIsAdmin(nextUser.userType === "admin")
    } catch (error) {
      console.error("[v0] Failed to refresh user:", error)
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
      setUser(null)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()

    const onStorage = (event: StorageEvent) => {
      if (event.key === "accessToken" || event.key === "refreshToken") {
        refreshUser()
      }
    }
    const onAuthTokenChanged = () => refreshUser()
    window.addEventListener("storage", onStorage)
    window.addEventListener("auth-token-changed", onAuthTokenChanged)
    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("auth-token-changed", onAuthTokenChanged)
    }
  }, [refreshUser])

  useEffect(() => {
    const interval = setInterval(refreshUser, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [refreshUser])

  return <UserContext.Provider value={{ user, loading, isAdmin, refreshUser }}>{children}</UserContext.Provider>
}

export function useUser() {
  return useContext(UserContext)
}
