"use client"

import { API_BASE_URL, platformAPI } from "@/lib/platform-api"

const ACCESS_TOKEN_KEY = "platform_access_token"
const REFRESH_TOKEN_KEY = "platform_refresh_token"

export type PlatformSession = {
  accessToken: string
  refreshToken?: string
}

export function getPlatformSession(): PlatformSession | null {
  if (typeof window === "undefined") return null
  const accessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY)
  if (!accessToken) return null
  const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY) || undefined
  return { accessToken, refreshToken }
}

export function savePlatformSession(session: PlatformSession) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken)
  if (session.refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken)
  }
}

export function clearPlatformSession() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export async function logoutPlatformSession() {
  const session = getPlatformSession()
  clearPlatformSession()
  if (session?.accessToken) {
    await platformAPI.logout(session.accessToken, session.refreshToken).catch(() => {})
  }
}

export async function platformAuthFetch(path: string, init: RequestInit = {}) {
  const session = getPlatformSession()
  const normalized = path.startsWith("/") ? path : `/${path}`
  return fetch(`${API_BASE_URL}${normalized}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      ...(init.headers || {}),
    },
  })
}
