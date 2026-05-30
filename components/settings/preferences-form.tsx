"use client"

import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { platformAPI } from "@/lib/platform-api"
import { getPlatformSession } from "@/lib/platform-session"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type PreferencesInput = {
  userId: string
  defaultVideoModel: string
  defaultImageModel: string
  defaultRatio: string
  language: string
  theme: string
  notifyEmail: boolean
  notifySms: boolean
  notifyInbox: boolean
}

const VIDEO_MODELS = [
  { value: "veo3.1-fast", label: "Veo 3.1 Fast · 高性价比" },
  { value: "veo3.1-fast-4k", label: "Veo 3.1 Fast 4K · 高分辨率" },
  { value: "sora-2", label: "Sora 2 · 电影级细节" },
  { value: "kling-2", label: "可灵 2.0 · 中文指令强" },
]

const IMAGE_MODELS = [
  { value: "nano-banana", label: "Nano Banana · 标准版" },
  { value: "nano-banana-pro-2k", label: "Nano Banana Pro 2K" },
  { value: "gpt-image-2", label: "GPT-Image 2 · 写实写意兼顾" },
]

const RATIOS = [
  { value: "9:16", label: "9:16 竖屏" },
  { value: "16:9", label: "16:9 横屏" },
  { value: "1:1", label: "1:1 方形" },
  { value: "4:3", label: "4:3 标准" },
]

export function PreferencesForm({ initial }: { initial: PreferencesInput }) {
  const [defaultVideoModel, setDefaultVideoModel] = useState(initial.defaultVideoModel)
  const [defaultImageModel, setDefaultImageModel] = useState(initial.defaultImageModel)
  const [defaultRatio, setDefaultRatio] = useState(initial.defaultRatio)
  const [language, setLanguage] = useState(initial.language)
  const [notifyEmail, setNotifyEmail] = useState(initial.notifyEmail)
  const [notifySms, setNotifySms] = useState(initial.notifySms)
  const [notifyInbox, setNotifyInbox] = useState(initial.notifyInbox)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const session = getPlatformSession()
    if (!session?.accessToken) return
    platformAPI.getPreferences(session.accessToken)
      .then((res) => {
        const data = res.data ?? res
        setDefaultVideoModel(data.defaultVideoModel ?? data.default_video_model ?? defaultVideoModel)
        setDefaultImageModel(data.defaultImageModel ?? data.default_image_model ?? defaultImageModel)
        setDefaultRatio(data.defaultRatio ?? data.default_ratio ?? defaultRatio)
        setLanguage(data.language ?? language)
        setNotifyEmail(data.notifyEmail ?? data.notify_email ?? notifyEmail)
        setNotifySms(data.notifySms ?? data.notify_sms ?? notifySms)
        setNotifyInbox(data.notifyInbox ?? data.notify_inbox ?? notifyInbox)
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
      await platformAPI.updatePreferences(session.accessToken, {
        defaultVideoModel,
        defaultImageModel,
        defaultRatio,
        language,
        theme: initial.theme,
        notifyEmail,
        notifySms,
        notifyInbox,
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-semibold">创作默认值</h2>
          <p className="text-xs text-muted-foreground">下次进入创作页面时将自动应用</p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>默认视频模型</Label>
            <Select value={defaultVideoModel} onValueChange={setDefaultVideoModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VIDEO_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>默认图像模型</Label>
            <Select value={defaultImageModel} onValueChange={setDefaultImageModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IMAGE_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>默认画面比例</Label>
            <Select value={defaultRatio} onValueChange={setDefaultRatio}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RATIOS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>界面语言</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zh-CN">简体中文</SelectItem>
                <SelectItem value="zh-TW">繁体中文</SelectItem>
                <SelectItem value="en-US">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-semibold">通知偏好</h2>
          <p className="text-xs text-muted-foreground">选择你希望接收通知的方式</p>
        </div>

        <div className="mt-5 flex flex-col divide-y divide-border">
          <NotifyRow
            label="邮件通知"
            desc="任务完成、账户安全、重要活动公告"
            checked={notifyEmail}
            onChange={setNotifyEmail}
          />
          <NotifyRow
            label="短信通知"
            desc="仅账户安全相关的关键提醒"
            checked={notifySms}
            onChange={setNotifySms}
          />
          <NotifyRow
            label="站内消息"
            desc="系统公告、创作提示、互动消息"
            checked={notifyInbox}
            onChange={setNotifyInbox}
          />
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
          <span>偏好已保存</span>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? <Spinner className="mr-2 h-4 w-4" /> : null}
          {loading ? "保存中..." : "保存偏好"}
        </Button>
      </div>
    </form>
  )
}

function NotifyRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string
  desc: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-[11px] text-muted-foreground">{desc}</span>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
