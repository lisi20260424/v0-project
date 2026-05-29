"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

type Props = {
  initialMusicTimeout: number
  initialImageTimeout: number
  initialVideoTimeout: number
  updatedAt: string | null
}

export function GenerationConfigForm({
  initialMusicTimeout,
  initialImageTimeout,
  initialVideoTimeout,
  updatedAt,
}: Props) {
  const [musicTimeout, setMusicTimeout] = useState(initialMusicTimeout)
  const [imageTimeout, setImageTimeout] = useState(initialImageTimeout)
  const [videoTimeout, setVideoTimeout] = useState(initialVideoTimeout)
  const [saving, setSaving] = useState(false)

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    try {
      const token = localStorage.getItem("accessToken") ?? ""
      const res = await fetch("/v1/admin/generation-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          musicTimeout: Math.max(60, musicTimeout),
          imageTimeout: Math.max(60, imageTimeout),
          videoTimeout: Math.max(120, videoTimeout),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "保存失败")
      toast.success("生成配置已更新")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败，请稍后重试")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5">
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-semibold">生成任务超时配置</h2>
          <p className="text-xs text-muted-foreground">
            配置各类生成任务的最大执行时间。超过配置时间的任务将被标记为失败。
          </p>
        </div>

        <div className="mt-6 space-y-5">
          {/* 音乐生成超时 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="music-timeout" className="text-sm font-medium">
              音乐生成超时时间 (秒)
            </Label>
            <p className="text-xs text-muted-foreground">
              单个音乐生成任务的最大等待时间，推荐范围: 300-900 秒 (5-15 分钟)
            </p>
            <Input
              id="music-timeout"
              type="number"
              min="60"
              max="3600"
              step="10"
              value={musicTimeout}
              onChange={(e) => setMusicTimeout(Math.max(60, parseInt(e.target.value) || 60))}
              placeholder="600"
              className="mt-1"
            />
          </div>

          {/* 图像生成超时 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="image-timeout" className="text-sm font-medium">
              图像生成超时时间 (秒)
            </Label>
            <p className="text-xs text-muted-foreground">
              单个图像生成任务的最大等待时间，推荐范围: 60-300 秒 (1-5 分钟)
            </p>
            <Input
              id="image-timeout"
              type="number"
              min="30"
              max="1800"
              step="10"
              value={imageTimeout}
              onChange={(e) => setImageTimeout(Math.max(30, parseInt(e.target.value) || 300))}
              placeholder="300"
              className="mt-1"
            />
          </div>

          {/* 视频生成超时 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="video-timeout" className="text-sm font-medium">
              视频生成超时时间 (秒)
            </Label>
            <p className="text-xs text-muted-foreground">
              单个视频生成任务的最大等待时间，推荐范围: 900-3600 秒 (15-60 分钟)
            </p>
            <Input
              id="video-timeout"
              type="number"
              min="120"
              max="7200"
              step="10"
              value={videoTimeout}
              onChange={(e) => setVideoTimeout(Math.max(120, parseInt(e.target.value) || 1800))}
              placeholder="1800"
              className="mt-1"
            />
          </div>
        </div>

        {/* 更新时间显示 */}
        {updatedAt && (
          <div className="mt-6 text-xs text-muted-foreground">
            最后更新: {new Date(updatedAt).toLocaleString("zh-CN")}
          </div>
        )}
      </section>

      {/* 保存按钮 */}
      <Button
        type="submit"
        disabled={saving}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {saving ? (
          <>
            <Spinner className="mr-2 h-4 w-4" />
            保存中...
          </>
        ) : (
          <>
            <Clock className="mr-2 h-4 w-4" />
            保存配置
          </>
        )}
      </Button>
    </form>
  )
}
