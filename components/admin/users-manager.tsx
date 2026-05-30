"use client"

import { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { UserEditDialog } from "@/components/admin/user-edit-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { CurrentUser } from "@/components/user-provider"

export type AdminUser = {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  points: number
  user_type: string
  status: string
  vip_tier: string | null
  vip_expires_at?: string | null
}

type UsersResponse = { users: AdminUser[]; total: number }
type Props = { initialUsers?: AdminUser[]; currentUser?: CurrentUser | null }

type UserEditForm = {
  id: string
  displayName: string
  avatarUrl: string
  userType: string
  status: string
  vipTier: string
  vipExpiresAt: string | null
  points: number
}

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost/api"

async function fetcher(): Promise<UsersResponse> {
  const token = localStorage.getItem("accessToken") ?? ""
  const res = await fetch(`${apiBase}/v1/admin/users`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || "Failed to load users")
  return json
}

export function UsersManager({ initialUsers = [] }: Props) {
  const { data, error, isLoading, mutate } = useSWR<UsersResponse>("admin-users", fetcher)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const users = data?.users ?? initialUsers

  async function handleSave(form: UserEditForm) {
    const token = localStorage.getItem("accessToken") ?? ""
    const res = await fetch(`${apiBase}/v1/admin/users/${form.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(form),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json.error || "Failed to save user")

    const updated = json.user as AdminUser
    await mutate((current) => {
      const base = current ?? { users, total: users.length }
      return { ...base, users: base.users.map((user) => (user.id === updated.id ? updated : user)) }
    }, false)
    toast.success("User updated")
  }

  if (isLoading && !users.length) {
    return <div className="rounded-xl border border-border bg-card p-10 text-sm text-muted-foreground">Loading users...</div>
  }
  if (error && !users.length) {
    return <div className="rounded-xl border border-border bg-card p-10 text-sm text-muted-foreground">{error instanceof Error ? error.message : "Failed to load users"}</div>
  }
  if (!users.length) {
    return <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">No users found</div>
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between gap-4 border-b border-border p-4 last:border-b-0">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar>
                <AvatarImage src={user.avatar_url ?? undefined} />
                <AvatarFallback>{(user.display_name || user.email || "U").slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{user.display_name || "Unnamed user"}</div>
                <div className="truncate text-xs text-muted-foreground">{user.email}</div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant="secondary">{user.user_type}</Badge>
              <Badge variant="outline">{user.status}</Badge>
              <span className="text-sm tabular-nums">{user.points} pts</span>
              <Button size="sm" variant="outline" onClick={() => setEditingUser(user)}>Edit</Button>
            </div>
          </div>
        ))}
      </div>

      <UserEditDialog
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        user={editingUser}
        currentUserIsAdmin
        onSave={handleSave}
      />
    </>
  )
}
