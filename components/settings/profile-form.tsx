"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Upload } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { platformAPI } from "@/lib/platform-api"

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
  const [email, setEmail] = useState(initial.email)
  const [displayName, setDisplayName] = useState(initial.displayName)
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl)
  const [bio, setBio] = useState(initial.bio)
  const [location, setLocation] = useState(initial.location)
  const [website, setWebsite] = useState(initial.website)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const initials = (displayName || email || "U").slice(0, 1).toUpperCase()

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    if (!token) return
    platformAPI.getProfile(token)
      .then((res) => {
        const data = res.data
        setEmail(data.email || "")
        setDisplayName(data.displayName || "")
        setAvatarUrl(data.avatarUrl || "")
        setBio(data.bio || "")
        setLocation(data.location || "")
        setWebsite(data.website || "")
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load profile"))
  }, [])

  async function uploadAvatar(file: File | undefined) {
    if (!file) return
    const token = localStorage.getItem("accessToken")
    if (!token) {
      setError("Please sign in first")
      return
    }
    setUploading(true)
    setError("")
    try {
      const res = await platformAPI.uploadAsset(token, file, "avatar")
      setAvatarUrl(res.data?.url || "")
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Avatar upload failed")
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const token = localStorage.getItem("accessToken")
    if (!token) {
      setError("Please sign in first")
      return
    }
    setLoading(true)
    setError("")
    setSuccess(false)
    try {
      const res = await platformAPI.updateProfile(token, { displayName, avatarUrl, bio, location, website })
      const data = res.data
      setEmail(data.email || email)
      setDisplayName(data.displayName || "")
      setAvatarUrl(data.avatarUrl || "")
      setBio(data.bio || "")
      setLocation(data.location || "")
      setWebsite(data.website || "")
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Profile</h2>
        <p className="mt-1 text-xs text-muted-foreground">Profile data is saved through the Go API and PostgreSQL.</p>
        <div className="mt-6 flex items-start gap-5">
          <Avatar className="h-20 w-20 ring-2 ring-border">
            <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-xl text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="avatar_file">Upload avatar</Label>
              <Input id="avatar_file" type="file" accept="image/*" disabled={uploading} onChange={(e) => uploadAvatar(e.target.files?.[0])} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="avatar_url">Avatar URL</Label>
              <Input id="avatar_url" type="url" placeholder="https://..." value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
            </div>
            {uploading ? <p className="text-xs text-muted-foreground"><Upload className="mr-1 inline h-3.5 w-3.5" />Uploading avatar...</p> : null}
          </div>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="display_name">Display name</Label>
            <Input id="display_name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={24} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} readOnly disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location">Location</Label>
            <Input id="location" placeholder="City, Country" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={48} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="website">Website</Label>
            <Input id="website" type="url" placeholder="https://..." value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-1.5">
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" rows={3} maxLength={160} value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
      </section>
      {error ? <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div> : null}
      {success ? <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary"><CheckCircle2 className="h-3.5 w-3.5" />Profile saved</div> : null}
      <div className="flex justify-end"><Button type="submit" disabled={loading || uploading}>{loading ? "Saving..." : "Save changes"}</Button></div>
    </form>
  )
}
