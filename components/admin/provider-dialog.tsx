"use client"

import { useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ICON_OPTIONS,
  ACCENT_OPTIONS,
  defaultIconNameForType,
  defaultAccentForType,
  resolveIcon,
} from "@/lib/icon-map"
import type { AdminProvider } from "@/components/admin/providers-manager"

const MODEL_TYPES = ["video", "image", "music"] as const
type ProviderModelType = (typeof MODEL_TYPES)[number]
const TYPE_LABEL: Record<ProviderModelType, string> = {
  video: "视频生成",
  image: "图像生成",
  music: "音乐生成",
}

type TypeUI = {
  display_name: string
  icon: string
  accent: string
  tag: string
  href: string
  cost: string
  description: string
}

type FormState = {
  id?: string
  name: string
  displayName: string
  description: string
  enabled: boolean
  sortOrder: number
  uiByType: Record<ProviderModelType, TypeUI>
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider?: AdminProvider
  onSave: (form: FormState) => Promise<void>
}

function emptyTypeUI(type: ProviderModelType): TypeUI {
  return {
    display_name: "",
    icon: defaultIconNameForType(type),
    accent: defaultAccentForType(type),
    tag: "",
    href: "",
    cost: "",
    description: "",
  }
}

function initial(provider?: AdminProvider): FormState {
  const defaults: Record<ProviderModelType, TypeUI> = {
    video: emptyTypeUI("video"),
    image: emptyTypeUI("image"),
    music: emptyTypeUI("music"),
  }

  if (!provider) {
    return {
      name: "",
      displayName: "",
      description: "",
      enabled: true,
      sortOrder: 0,
      uiByType: defaults,
    }
  }

  const cfg = (provider.config ?? {}) as { ui_by_type?: Partial<Record<ProviderModelType, Partial<TypeUI>>> }
  const uiByType = { ...defaults }
  for (const t of MODEL_TYPES) {
    const stored = cfg.ui_by_type?.[t] ?? {}
    uiByType[t] = {
      display_name: stored.display_name ?? "",
      icon: stored.icon || defaults[t].icon,
      accent: stored.accent || defaults[t].accent,
      tag: stored.tag ?? "",
      href: stored.href ?? "",
      cost: stored.cost ?? "",
      description: stored.description ?? "",
    }
  }

  return {
    id: provider.id,
    name: provider.name,
    displayName: provider.display_name,
    description: provider.description ?? "",
    enabled: provider.enabled,
    sortOrder: provider.sort_order,
    uiByType,
  }
}

export function ProviderDialog({ open, onOpenChange, provider, onSave }: Props) {
  const isEdit = !!provider
  const [form, setForm] = useState<FormState>(initial(provider))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm(initial(provider))
      setError(null)
    }
  }, [open, provider])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateTypeUI(type: ProviderModelType, key: keyof TypeUI, value: string) {
    setForm((prev) => ({
      ...prev,
      uiByType: { ...prev.uiByType, [type]: { ...prev.uiByType[type], [key]: value } },
    }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (!form.name.trim()) {
      setError("请填写供应商标识")
      return
    }
    if (!form.displayName.trim()) {
      setError("请填写供应商名称")
      return
    }
    setSubmitting(true)
    try {
      await onSave(form)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full flex-col max-w-xl">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{isEdit ? "编辑供应商" : "新建供应商"}</DialogTitle>
          <DialogDescription>
            配置 AI 模型供应商信息，含 AI 工具菜单中各类型的展示样式。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-col gap-4">
          <div className="min-h-0 flex-1 overflow-y-auto px-1 pr-3 space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="p-name" className="text-xs font-medium">
                  供应商标识
                </Label>
                <Input
                  id="p-name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="例如：openai"
                  disabled={submitting || isEdit}
                  required
                  className="h-8 text-sm"
                />
                <p className="text-[10px] text-muted-foreground">英文标识，编辑后不可修改</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="p-display" className="text-xs font-medium">
                  供应商名称
                </Label>
                <Input
                  id="p-display"
                  value={form.displayName}
                  onChange={(e) => update("displayName", e.target.value)}
                  placeholder="例如：OpenAI"
                  disabled={submitting}
                  required
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-desc" className="text-xs font-medium">
                供应商描述
              </Label>
              <Textarea
                id="p-desc"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="供应商的整体介绍（管理员可见）"
                disabled={submitting}
                className="text-sm resize-none"
                rows={2}
              />
            </div>

            <div className="space-y-2 rounded-lg border border-border/50 bg-secondary/20 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium">展示配置</p>
                <p className="text-[10px] text-muted-foreground">不同类型可独立配置图标 / 标签 / 跳转</p>
              </div>
              <Tabs defaultValue="video" className="w-full">
                <TabsList className="grid grid-cols-3 h-8">
                  {MODEL_TYPES.map((t) => (
                    <TabsTrigger key={t} value={t} className="text-xs">
                      {TYPE_LABEL[t]}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {MODEL_TYPES.map((t) => (
                  <TabsContent key={t} value={t} className="pt-3">
                    <TypeUIFields
                      type={t}
                      ui={form.uiByType[t]}
                      onChange={(key, value) => updateTypeUI(t, key, value)}
                      disabled={submitting}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5">
              <Label htmlFor="p-enabled" className="text-sm font-medium cursor-pointer">
                启用此供应商
              </Label>
              <Switch
                id="p-enabled"
                checked={form.enabled}
                onCheckedChange={(enabled) => update("enabled", enabled)}
                disabled={submitting}
              />
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 gap-2 sm:gap-2">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={submitting}>
              取消
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Spinner className="h-4 w-4 mr-2" />}
              {isEdit ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TypeUIFields({
  type,
  ui,
  onChange,
  disabled,
}: {
  type: ProviderModelType
  ui: TypeUI
  onChange: (key: keyof TypeUI, value: string) => void
  disabled?: boolean
}) {
  const PreviewIcon = resolveIcon(ui.icon)
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-1 sm:col-span-2">
        <Label htmlFor={`ui-display-${type}`} className="text-xs font-medium">
          产品名（在菜单中作为大字显示，留空则使用供应商名称）
        </Label>
        <Input
          id={`ui-display-${type}`}
          value={ui.display_name}
          onChange={(e) => onChange("display_name", e.target.value)}
          placeholder={type === "video" ? "例：Veo 视频" : type === "image" ? "例：Nano Banana" : "例：Suno 音乐"}
          disabled={disabled}
          className="h-7 text-xs"
        />
      </div>

      <div className="flex flex-col gap-1 sm:col-span-2">
        <Label className="text-xs font-medium">展示图标</Label>
        <div className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${ui.accent} text-foreground ring-1 ring-border`}
          >
            <PreviewIcon className="h-4 w-4" />
          </div>
          <Select value={ui.icon} onValueChange={(v) => onChange("icon", v)} disabled={disabled}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ICON_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1 sm:col-span-2">
        <Label className="text-xs font-medium">渐变色</Label>
        <Select value={ui.accent} onValueChange={(v) => onChange("accent", v)} disabled={disabled}>
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACCENT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor={`ui-tag-${type}`} className="text-xs font-medium">
          标签
        </Label>
        <Input
          id={`ui-tag-${type}`}
          value={ui.tag}
          onChange={(e) => onChange("tag", e.target.value)}
          placeholder="例：4K / Pro / HOT"
          disabled={disabled}
          className="h-7 text-xs"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor={`ui-cost-${type}`} className="text-xs font-medium">
          起步消耗文案
        </Label>
        <Input
          id={`ui-cost-${type}`}
          value={ui.cost}
          onChange={(e) => onChange("cost", e.target.value)}
          placeholder="例：30 点起"
          disabled={disabled}
          className="h-7 text-xs"
        />
      </div>

      <div className="flex flex-col gap-1 sm:col-span-2">
        <Label htmlFor={`ui-href-${type}`} className="text-xs font-medium">
          跳转路径
        </Label>
        <Input
          id={`ui-href-${type}`}
          value={ui.href}
          onChange={(e) => onChange("href", e.target.value)}
          placeholder={`例：/${type === "music" ? "suno" : type}`}
          disabled={disabled}
          className="h-7 text-xs"
        />
      </div>

      <div className="flex flex-col gap-1 sm:col-span-2">
        <Label htmlFor={`ui-desc-${type}`} className="text-xs font-medium">
          展示描述
        </Label>
        <Textarea
          id={`ui-desc-${type}`}
          value={ui.description}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="将出现在首页 #tools 卡片的描述区域"
          disabled={disabled}
          rows={2}
          className="text-xs resize-none"
        />
      </div>
    </div>
  )
}
