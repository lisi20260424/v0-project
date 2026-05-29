"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { Pencil, Search, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Spinner } from "@/components/ui/spinner"
import { UserEditDialog } from "@/components/admin/user-edit-dialog"
import type { CurrentUser } from "@/components/user-provider"
import {
  USER_TYPES,
  USER_TYPE_LABELS,
  USER_STATUSES,
  USER_STATUS_LABELS,
  VIP_TIERS,
  VIP_TIER_LABELS,
  type UserStatus,
} from "@/lib/admin"
import { cn } from "@/lib/utils"

export type AdminUser = {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  points: number
  user_type: string
  status: string
  vip_tier: string | null
  vip_expires_at: string | null
  created_at: string
  last_sign_in_at: string | null
}

type UsersResponse = {
  users: AdminUser[]
  total: number
  page: number
  pageSize: number
}

type Banner = { ok: boolean; message: string } | null

const fetcher = async (url: string): Promise<UsersResponse> => {
  const token = localStorage.getItem("accessToken") ?? ""
  const res = await fetch(url, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? "鍔犺浇澶辫触")
  return json
}

const STATUS_BADGE: Record<UserStatus, string> = {
  active: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  suspended: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  banned: "bg-destructive/15 text-destructive border-destructive/30",
}

function formatDateTime(value: string | null): string {
  if (!value) return "鈥?
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "鈥?
  return d.toLocaleString("zh-CN", { hour12: false })
}

export function UsersManager({ initialUsers = [], currentUser }: Props) {
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [userType, setUserType] = useState<string>("all")
  const [status, setStatus] = useState<string>("all")
  const [vipTier, setVipTier] = useState<string>("all")
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [banner, setBanner] = useState<Banner>(null)

  // 闃叉姈鎼滅储
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [userType, status, vipTier])

  const queryKey = useMemo(() => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (userType !== "all") params.set("userType", userType)
    if (status !== "all") params.set("status", status)
    if (vipTier !== "all") params.set("vipTier", vipTier)
    params.set("page", String(page))
    params.set("pageSize", String(pageSize))
    return `/v1/admin/users?${params.toString()}`
  }, [search, userType, status, vipTier, page])

  const { data, error, isLoading, mutate } = useSWR<UsersResponse>(queryKey, fetcher, {
    keepPreviousData: true,
  })

  console.log("[v0] UsersManager SWR state:", { queryKey, data, error, isLoading })

  function showBanner(b: Banner) {
    setBanner(b)
    if (b) setTimeout(() => setBanner(null), 3000)
  }

  async function handleSave(form: {
    id: string
    displayName: string
    avatarUrl: string
    userType: string
    status: string
    vipTier: string
    vipExpiresAt: string | null
    points: number
  }) {
    const token = localStorage.getItem("accessToken") ?? ""
      const res = await fetch(`/v1/admin/users/${form.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? "淇濆瓨澶辫触")
    showBanner({ ok: true, message: "鐢ㄦ埛淇℃伅宸叉洿鏂? })
    await mutate()
  }

  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const users = data?.users ?? []

  return (
    <div className="flex flex-col gap-4">
      {/* 鎼滅储/绛涢€夋爮 */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 md:flex-row md:items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="鎼滅储閭鎴栨樀绉?
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={userType} onValueChange={setUserType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="鐢ㄦ埛绫诲瀷" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">鍏ㄩ儴绫诲瀷</SelectItem>
              {USER_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {USER_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="鐘舵€? />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">鍏ㄩ儴鐘舵€?/SelectItem>
              {USER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {USER_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={vipTier} onValueChange={setVipTier}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="浼氬憳绛夌骇" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">鍏ㄩ儴浼氬憳</SelectItem>
              {VIP_TIERS.map((v) => (
                <SelectItem key={v} value={v}>
                  {VIP_TIER_LABELS[v]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {banner ? (
        <div
          className={
            banner.ok
              ? "flex items-start gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary"
              : "flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          }
        >
          {banner.ok ? (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          )}
          <span>{banner.message}</span>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error instanceof Error ? error.message : "鍔犺浇澶辫触"}</span>
        </div>
      ) : null}

      {/* 鐢ㄦ埛琛ㄦ牸 */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">鐢ㄦ埛</TableHead>
              <TableHead className="w-[120px]">绫诲瀷</TableHead>
              <TableHead className="w-[120px]">浼氬憳</TableHead>
              <TableHead className="w-[100px] text-right">鐐规暟</TableHead>
              <TableHead className="w-[100px]">鐘舵€?/TableHead>
              <TableHead className="w-[160px]">鏈€杩戠櫥褰?/TableHead>
              <TableHead className="w-[80px] text-right">鎿嶄綔</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Spinner className="h-4 w-4" />
                    鍔犺浇涓?..
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-sm text-muted-foreground">
                  娌℃湁鍖归厤鐨勭敤鎴?
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const initials = (u.display_name || u.email || "U").slice(0, 1).toUpperCase()
                const vipLabel = u.vip_tier
                  ? VIP_TIER_LABELS[u.vip_tier as keyof typeof VIP_TIER_LABELS] ?? u.vip_tier
                  : "鏃犱細鍛?
                const userTypeLabel =
                  USER_TYPE_LABELS[u.user_type as keyof typeof USER_TYPE_LABELS] ?? u.user_type
                const statusKey = (u.status as UserStatus) in STATUS_BADGE ? (u.status as UserStatus) : "active"
                const statusLabel =
                  USER_STATUS_LABELS[u.status as UserStatus] ?? u.status
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={u.avatar_url ?? undefined} alt="" />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-xs text-primary-foreground">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-medium">
                            {u.display_name || "鏈懡鍚嶇敤鎴?}
                          </span>
                          <span className="truncate text-[11px] text-muted-foreground">
                            {u.email ?? "鈥?}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[11px]">
                        {userTypeLabel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[11px]",
                          u.vip_tier && "border-primary/40 bg-primary/10 text-primary",
                        )}
                      >
                        {vipLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{u.points}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[11px]", STATUS_BADGE[statusKey])}>
                        {statusLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground tabular-nums">
                      {formatDateTime(u.last_sign_in_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(u)}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">缂栬緫</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* 鍒嗛〉 */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div>
          鍏?<span className="font-medium text-foreground tabular-nums">{total}</span> 涓敤鎴?
          {total > 0 ? (
            <>
              {" 路 "}
              绗?<span className="tabular-nums">{page}</span> / {totalPages} 椤?
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            涓婁竴椤?
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages || isLoading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            涓嬩竴椤?
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <UserEditDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        user={editing}
        currentUserIsAdmin={currentUser?.userType === "admin"}
        onSave={handleSave}
      />
    </div>
  )
}



