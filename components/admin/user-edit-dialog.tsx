"use client"

import { useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import type { AdminUser } from "@/components/admin/users-manager"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AdminUser | null
  currentUserIsAdmin: boolean
  onSave: (form: {
    id: string
    displayName: string
    avatarUrl: string
    userType: string
    status: string
    vipTier: string
    vipExpiresAt: string | null
    points: number
  }) => Promise<void>
}

function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function UserEditDialog({ open, onOpenChange, user, currentUserIsAdmin, onSave }: Props) {
  const [displayName, setDisplayName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [userType, setUserType] = useState("normal")
  const [status, setStatus] = useState("active")
  const [vipTier, setVipTier] = useState("none")
  const [vipExpiresAt, setVipExpiresAt] = useState("")
  const [points, setPoints] = useState("0")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setDisplayName(user.display_name ?? "")
    setAvatarUrl(user.avatar_url ?? "")
    setUserType(user.user_type ?? "normal")
    setStatus(user.status ?? "active")
    setVipTier(user.vip_tier || "none")
    setVipExpiresAt(isoToLocalInput(user.vip_expires_at))
    setPoints(String(user.points ?? 0))
    setError(null)
  }, [user])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!user) return

    const parsedPoints = Number(points)
    if (!Number.isInteger(parsedPoints) || parsedPoints < 0) {
      setError("Points must be a non-negative integer")
      return
    }

    setError(null)
    setSaving(true)
    try {
      await onSave({
        id: user.id,
        displayName,
        avatarUrl,
        userType,
        status,
        vipTier: vipTier === "none" ? "" : vipTier,
        vipExpiresAt: vipExpiresAt ? new Date(vipExpiresAt).toISOString() : null,
        points: parsedPoints,
      })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save user")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription>{user?.email ? <span className="font-mono">{user.email}</span> : "Update user profile, role, status, membership, and points."}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <section className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={48} />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label htmlFor="avatarUrl">Avatar URL</Label>
              <Input id="avatarUrl" type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
            </div>
          </section>

          <Separator />

          <section className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>User type</Label>
              <Select value={userType} onValueChange={setUserType} disabled={!currentUserIsAdmin}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>VIP tier</Label>
              <Select value={vipTier} onValueChange={setVipTier}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vipExpiresAt">VIP expires at</Label>
              <Input id="vipExpiresAt" type="datetime-local" value={vipExpiresAt} onChange={(e) => setVipExpiresAt(e.target.value)} disabled={vipTier === "none" || vipTier === "lifetime"} />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label htmlFor="points">Points</Label>
              <Input id="points" type="number" inputMode="numeric" min={0} step={1} value={points} onChange={(e) => setPoints(e.target.value)} />
            </div>
          </section>

          {error ? (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner className="mr-2 h-4 w-4" /> : null}
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
