"use client"

import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { platformAPI } from "@/lib/platform-api"
import { getPlatformSession } from "@/lib/platform-session"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"

type ProfileInput = {
  id: string
  email: string
  displayName: string
  avatarUrl: string
  bio: string
  location: string
  website: string
}

export function ProfileForm({ initial }: { initial: ProfileInput }) {
  const [displayName, setDisplayName] = useState(initial.displayName)
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl)
  const [bio, setBio] = useState(initial.bio)
  const [location, setLocation] = useState(initial.location)
  const [website, setWebsite] = useState(initial.website)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const session = getPlatformSession()
    if (!session?.accessToken) return
    platformAPI.getProfile(session.accessToken)
      .then((res) => {
        const data = res.data ?? res
        setDisplayName(data.displayName ?? data.display_name ?? "")
        setAvatarUrl(data.avatarUrl ?? data.avatar_url ?? "")
        setBio(data.bio ?? "")
        setLocation(data.location ?? "")
        setWebsite(data.website ?? "")
      })
      .catch(() => {})
  }, [])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)
    try {
      const session = getPlatformSession()
      if (!session?.accessToken) throw new Error("请先登录")
      await platformAPI.updateProfile(session.accessToken, { displayName, avatarUrl, bio, location, website })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  const initials = (displayName || initial.email || "U").slice(0, 1).toUpperCase()

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-semibold">基本资料</h2>
          <p className="text-xs text-muted-foreground">这些信息会展示在你公开的作品和创作者主页</p>
        </div>

        <div className="mt-6 flex items-start gap-5">
          <Avatar className="h-20 w-20 ring-2 ring-border">
            <AvatarImage src={avatarUrl || undefined} alt="头像" />
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-xl text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="avatar_url">头像地址（URL）</Label>
            <Input
              id="avatar_url"
              type="url"
              placeholder="https://..."
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              disabled={loading}
            />
            <p className="text-[11px] text-muted-foreground">后续支持从本地上传头像，暂时请填写图片链接</p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="display_name">昵称</Label>
            <Input
              id="display_name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={24}
              disabled={loading}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">邮箱（只读）</Label>
            <Input id="email" value={initial.email} readOnly disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location">所在地</Label>
            <Input
              id="location"
              placeholder="例如：杭州"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={48}
              disabled={loading}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="website">个人网站</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://..."
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-1.5">
          <Label htmlFor="bio">个人简介</Label>
          <Textarea
            id="bio"
            rows={3}
            maxLength={160}
            placeholder="介绍一下自己，让其他创作者认识你"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={loading}
          />
          <p className="text-right text-[11px] text-muted-foreground tabular-nums">{bio.length} / 160</p>
        </div>
      </section>

      {error ? (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {success ? (
        <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>资料已更新</span>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? <Spinner className="mr-2 h-4 w-4" /> : null}
          {loading ? "保存中..." : "保存更改"}
        </Button>
      </div>
    </form>
  )
}
