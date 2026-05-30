"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { API_BASE_URL } from "@/lib/platform-api"

type Props = {
  initialMusicTimeout: number
  initialImageTimeout: number
  initialVideoTimeout: number
  updatedAt: string | null
}

type GenerationConfig = {
  musicTimeout?: number
  imageTimeout?: number
  videoTimeout?: number
  updatedAt?: string | null
}

export function GenerationConfigForm({ initialMusicTimeout, initialImageTimeout, initialVideoTimeout, updatedAt: initialUpdatedAt }: Props) {
  const [musicTimeout, setMusicTimeout] = useState(initialMusicTimeout)
  const [imageTimeout, setImageTimeout] = useState(initialImageTimeout)
  const [videoTimeout, setVideoTimeout] = useState(initialVideoTimeout)
  const [updatedAt, setUpdatedAt] = useState<string | null>(initialUpdatedAt)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("accessToken") ?? ""
    if (!token) return

    setLoading(true)
    fetch(`${API_BASE_URL}/v1/admin/generation-config`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? "Failed to load generation settings")
        const data = json.data as GenerationConfig
        setMusicTimeout(data.musicTimeout ?? 600)
        setImageTimeout(data.imageTimeout ?? 300)
        setVideoTimeout(data.videoTimeout ?? 1800)
        setUpdatedAt(data.updatedAt ?? null)
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load generation settings"))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        musicTimeout: Math.max(60, musicTimeout),
        imageTimeout: Math.max(60, imageTimeout),
        videoTimeout: Math.max(120, videoTimeout),
      }
      const token = localStorage.getItem("accessToken") ?? ""
      const res = await fetch(`${API_BASE_URL}/v1/admin/generation-config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to save generation settings")
      const data = json.data as GenerationConfig
      setMusicTimeout(data.musicTimeout ?? payload.musicTimeout)
      setImageTimeout(data.imageTimeout ?? payload.imageTimeout)
      setVideoTimeout(data.videoTimeout ?? payload.videoTimeout)
      setUpdatedAt(data.updatedAt ?? new Date().toISOString())
      toast.success("Generation settings saved")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save generation settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5">
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-semibold">Generation timeouts</h2>
          <p className="text-xs text-muted-foreground">Configure the maximum execution time for generation jobs.</p>
        </div>

        <div className="mt-6 space-y-5">
          <TimeoutField id="music-timeout" label="Music timeout (seconds)" hint="Recommended: 300-900 seconds." value={musicTimeout} min={60} max={3600} disabled={saving || loading} onChange={setMusicTimeout} />
          <TimeoutField id="image-timeout" label="Image timeout (seconds)" hint="Recommended: 60-300 seconds." value={imageTimeout} min={60} max={1800} disabled={saving || loading} onChange={setImageTimeout} />
          <TimeoutField id="video-timeout" label="Video timeout (seconds)" hint="Recommended: 900-3600 seconds." value={videoTimeout} min={120} max={7200} disabled={saving || loading} onChange={setVideoTimeout} />
        </div>

        <div className="mt-6 text-xs text-muted-foreground">{loading ? "Loading settings..." : updatedAt ? `Last updated: ${new Date(updatedAt).toLocaleString("zh-CN")}` : "Not configured"}</div>
      </section>

      <Button type="submit" disabled={saving || loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
        {saving ? <Spinner className="mr-2 h-4 w-4" /> : <Clock className="mr-2 h-4 w-4" />}
        {saving ? "Saving..." : "Save settings"}
      </Button>
    </form>
  )
}

function TimeoutField({ id, label, hint, value, min, max, disabled, onChange }: { id: string; label: string; hint: string; value: number; min: number; max: number; disabled: boolean; onChange: (value: number) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <Input id={id} type="number" min={min} max={max} step="10" value={value} onChange={(e) => onChange(Math.max(min, parseInt(e.target.value) || min))} disabled={disabled} className="mt-1" />
    </div>
  )
}
