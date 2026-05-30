"use client"

import { useEffect, useState } from "react"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { platformAPI } from "@/lib/platform-api"

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

export function PreferencesForm({ initial }: { initial: PreferencesInput }) {
  const [defaultVideoModel, setDefaultVideoModel] = useState(initial.defaultVideoModel)
  const [defaultImageModel, setDefaultImageModel] = useState(initial.defaultImageModel)
  const [defaultRatio, setDefaultRatio] = useState(initial.defaultRatio)
  const [language, setLanguage] = useState(initial.language)
  const [notifyEmail, setNotifyEmail] = useState(initial.notifyEmail)
  const [notifySms, setNotifySms] = useState(initial.notifySms)
  const [notifyInbox, setNotifyInbox] = useState(initial.notifyInbox)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    if (!token) return
    platformAPI.getPreferences(token).then((res) => {
      const data = res.data
      setDefaultVideoModel(data.defaultVideoModel || "model_veo_video")
      setDefaultImageModel(data.defaultImageModel || "model_gpt_image")
      setDefaultRatio(data.defaultRatio || "16:9")
      setLanguage(data.language || "zh-CN")
      setNotifyEmail(Boolean(data.notifyEmail))
      setNotifySms(Boolean(data.notifySms))
      setNotifyInbox(Boolean(data.notifyInbox))
    }).catch((err) => setError(err instanceof Error ? err.message : "加载偏好失败"))
  }, [])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const token = localStorage.getItem("accessToken")
    if (!token) {
      setError("请先登录")
      return
    }
    setLoading(true)
    setError("")
    setSuccess(false)
    try {
      await platformAPI.updatePreferences(token, {
        defaultVideoModel,
        defaultImageModel,
        defaultRatio,
        language,
        theme: initial.theme || "light",
        notifyEmail,
        notifySms,
        notifyInbox,
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存偏好失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">创作默认值</h2>
        <p className="mt-1 text-xs text-muted-foreground">偏好会保存到 Go API 和 PostgreSQL。</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="默认视频模型"><Select value={defaultVideoModel} onValueChange={setDefaultVideoModel}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="model_veo_video">Veo 3.1</SelectItem></SelectContent></Select></Field>
          <Field label="默认图像模型"><Select value={defaultImageModel} onValueChange={setDefaultImageModel}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="model_gpt_image">GPT-Image</SelectItem></SelectContent></Select></Field>
          <Field label="默认画面比例"><Select value={defaultRatio} onValueChange={setDefaultRatio}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="16:9">16:9</SelectItem><SelectItem value="9:16">9:16</SelectItem><SelectItem value="1:1">1:1</SelectItem></SelectContent></Select></Field>
          <Field label="界面语言"><Select value={language} onValueChange={setLanguage}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="zh-CN">简体中文</SelectItem><SelectItem value="en-US">English</SelectItem></SelectContent></Select></Field>
        </div>
      </section>
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">通知偏好</h2>
        <NotifyRow label="邮件通知" checked={notifyEmail} onChange={setNotifyEmail} />
        <NotifyRow label="短信通知" checked={notifySms} onChange={setNotifySms} />
        <NotifyRow label="站内消息" checked={notifyInbox} onChange={setNotifyInbox} />
      </section>
      {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}
      {success && <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary"><CheckCircle2 className="h-3.5 w-3.5" />偏好已保存</div>}
      <div className="flex justify-end"><Button type="submit" disabled={loading}>{loading ? "保存中..." : "保存偏好"}</Button></div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5"><Label>{label}</Label>{children}</div>
}

function NotifyRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <div className="mt-4 flex items-center justify-between"><span className="text-sm font-medium">{label}</span><Switch checked={checked} onCheckedChange={onChange} /></div>
}
