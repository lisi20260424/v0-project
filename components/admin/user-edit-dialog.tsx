"use client"

import { useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  USER_TYPES,
  USER_TYPE_LABELS,
  USER_STATUSES,
  USER_STATUS_LABELS,
  VIP_TIERS,
  VIP_TIER_LABELS,
} from "@/lib/admin"
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

// 把 ISO 时间字符串转 input[type=datetime-local] 需要的格式 (YYYY-MM-DDTHH:mm)
function isoToLocalInput(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`
}

export function UserEditDialog({ open, onOpenChange, user, currentUserIsAdmin, onSave }: Props) {
  const [displayName, setDisplayName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [userType, setUserType] = useState<string>("normal")
  const [status, setStatus] = useState<string>("active")
  const [vipTier, setVipTier] = useState<string>("")
  const [vipExpiresAt, setVipExpiresAt] = useState<string>("")
  const [points, setPoints] = useState<string>("0")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setDisplayName(user.display_name ?? "")
    setAvatarUrl(user.avatar_url ?? "")
    setUserType(user.user_type ?? "normal")
    setStatus(user.status ?? "active")
    // vip_tier 为 null 时显示空值，不显示"free"
    setVipTier(user.vip_tier ?? "")
    setVipExpiresAt(isoToLocalInput(user.vip_expires_at))
    setPoints(String(user.points ?? 0))
    setError(null)
  }, [user])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!user) return
    setError(null)

    const pts = Number(points)
    if (!Number.isFinite(pts) || pts < 0 || !Number.isInteger(pts)) {
      setError("点数必须是非负整数")
      return
    }

    setSaving(true)
    try {
      await onSave({
        id: user.id,
        displayName,
        avatarUrl,
        userType,
        status,
        vipTier,
        vipExpiresAt: vipExpiresAt ? new Date(vipExpiresAt).toISOString() : null,
        points: pts,
      })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>编辑用户</DialogTitle>
          <DialogDescription>
            {user?.email ? <span className="font-mono">{user.email}</span> : "修改用户资料、会员、点数与状态"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* 基本资料 */}
          <section className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label htmlFor="displayName">昵称</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={48}
              />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label htmlFor="avatarUrl">头像 URL</Label>
              <Input
                id="avatarUrl"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </section>

          <Separator />

          {/* 账号管理 */}
          <section className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>用户类型</Label>
              <Select value={userType} onValueChange={setUserType} disabled={!currentUserIsAdmin}>
                <SelectTrigger className={!currentUserIsAdmin ? "opacity-50" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {USER_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!currentUserIsAdmin && (
                <p className="text-[11px] text-muted-foreground">仅管理员可以设置用户类型</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>用户状态</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {USER_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>会员等级</Label>
            <Select value={vipTier} onValueChange={setVipTier}>
              <SelectTrigger>
                <SelectValue placeholder="选择会员等级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">无会员</SelectItem>
                {VIP_TIERS.map((v) => (
                  <SelectItem key={v} value={v}>
                    {VIP_TIER_LABELS[v]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vipExpiresAt">会员到期时间</Label>
              <Input
                id="vipExpiresAt"
                type="datetime-local"
                value={vipExpiresAt}
                onChange={(e) => setVipExpiresAt(e.target.value)}
                disabled={!vipTier || vipTier === "lifetime"}
              />
              <p className="text-[11px] text-muted-foreground">
                免费用户和终身会员无需到期时间
              </p>
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label htmlFor="points">点数余额</Label>
              <Input
                id="points"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={points}
                onChange={(e) => setPoints(e.target.value)}
              />
            </div>
          </section>

          {error ? (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              取消
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner className="mr-2 h-4 w-4" /> : null}
              {saving ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
