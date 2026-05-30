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

// 各类型支持的 API 格式与默认端点
const FORMAT_OPTIONS: Record<ProviderModelType, { value: string; label: string; defaultPath: string }[]> = {
  image: [
    { value: "openai", label: "OpenAI 兼容", defaultPath: "/v1/images/generations" },
    { value: "qwen-openai", label: "通义千问 OpenAI 格式", defaultPath: "/v1/images/generations" },
    { value: "gemini", label: "Gemini 原生格式", defaultPath: "/v1beta/models/{model}:generateContent" },
  ],
  video: [
    { value: "openai", label: "OpenAI 兼容", defaultPath: "/v1/video/generations" },
    { value: "sora", label: "Sora", defaultPath: "/v1/videos" },
    { value: "kling", label: "可灵 Kling", defaultPath: "/kling/v1/videos/text2video" },
    { value: "jimeng", label: "字节即梦 Jimeng", defaultPath: "/jimeng/v1/videos/text2video" },
  ],
  music: [
    { value: "openai", label: "OpenAI TTS", defaultPath: "/v1/audio/speech" },
    { value: "gemini", label: "Gemini 原生格式", defaultPath: "/v1beta/models/{model}:generateContent" },
  ],
}

type TypeUI = {
  display_name: string
  icon: string
  accent: string
  tag: string
  cost: string
  description: string
}

type EndpointCfg = {
  format: string
  path: string
  pollPath: string
  contentPath?: string
}

type FormState = {
  id?: string
  name: string
  displayName: string
  description: string
  enabled: boolean
  sortOrder: number
  uiByType: Record<ProviderModelType, TypeUI>
  endpointsByType: Record<ProviderModelType, EndpointCfg>
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
    cost: "",
    description: "",
  }
}

function defaultEndpoint(type: ProviderModelType): EndpointCfg {
  const opts = FORMAT_OPTIONS[type]
  return { format: opts[0].value, path: opts[0].defaultPath, pollPath: "" }
}

function initial(provider?: AdminProvider): FormState {
  const defaultsUI: Record<ProviderModelType, TypeUI> = {
    video: emptyTypeUI("video"),
    image: emptyTypeUI("image"),
    music: emptyTypeUI("music"),
  }
  const defaultsEndpoint: Record<ProviderModelType, EndpointCfg> = {
    video: defaultEndpoint("video"),
    image: defaultEndpoint("image"),
    music: defaultEndpoint("music"),
  }

  if (!provider) {
    return {
      name: "",
      displayName: "",
      description: "",
      enabled: true,
      sortOrder: 0,
      uiByType: defaultsUI,
      endpointsByType: defaultsEndpoint,
    }
  }

  const cfg = (provider.config ?? {}) as {
    ui_by_type?: Partial<Record<ProviderModelType, Partial<TypeUI>>>
    endpoints?: Partial<Record<ProviderModelType, Partial<EndpointCfg>>>
  }

  const uiByType = { ...defaultsUI }
  const endpointsByType = { ...defaultsEndpoint }
  for (const t of MODEL_TYPES) {
    const stored = cfg.ui_by_type?.[t] ?? {}
    uiByType[t] = {
      display_name: stored.display_name ?? "",
      icon: stored.icon || defaultsUI[t].icon,
      accent: stored.accent || defaultsUI[t].accent,
      tag: stored.tag ?? "",
      cost: stored.cost ?? "",
      description: stored.description ?? "",
    }
    const ep = cfg.endpoints?.[t] ?? {}
    endpointsByType[t] = {
      format: (ep.format as string) || defaultsEndpoint[t].format,
      path: ep.path ?? defaultsEndpoint[t].path,
      pollPath: ep.pollPath ?? "",
    }
  }

  return {
    id: provider.id,
    name: provider.name,
    displayName: provider.display_name,
    description: provider.description ?? "",
    enabled: provider.enabled,
    sortOrder: provider.sort_order ?? 0,
    uiByType,
    endpointsByType,
  }
}

export function ProviderDialog({ open, onOpenChange, provider, onSave }: Props) {
  const isEdit = !!provider?.id
  const [form, setForm] = useState<FormState>(initial(provider))
  const [selectedType, setSelectedType] = useState<ProviderModelType>("video")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      const initialForm = initial(provider)
      setForm(initialForm)
      setError(null)
      if (isEdit) {
        const firstConfiguredType = MODEL_TYPES.find((t) => {
          const ui = initialForm.uiByType[t]
          return ui.icon || ui.tag || ui.cost || ui.description
        })
        setSelectedType(firstConfiguredType || "video")
      } else {
        setSelectedType("video")
      }
    }
  }, [open, provider, isEdit])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateTypeUI(type: ProviderModelType, key: keyof TypeUI, value: string) {
    setForm((prev) => ({
      ...prev,
      uiByType: { ...prev.uiByType, [type]: { ...prev.uiByType[type], [key]: value } },
    }))
  }

  function updateEndpoint(type: ProviderModelType, key: keyof EndpointCfg, value: string) {
    setForm((prev) => ({
      ...prev,
      endpointsByType: {
        ...prev.endpointsByType,
        [type]: { ...prev.endpointsByType[type], [key]: value },
      },
    }))
  }

  function selectFormat(type: ProviderModelType, formatValue: string) {
    const opt = FORMAT_OPTIONS[type].find((o) => o.value === formatValue)
    setForm((prev) => ({
      ...prev,
      endpointsByType: {
        ...prev.endpointsByType,
        [type]: {
          ...prev.endpointsByType[type],
          format: formatValue,
          // 切换格式时若路径仍是某个内置默认值，则同步成新格式的默认路径
          path:
            FORMAT_OPTIONS[type].some((o) => o.defaultPath === prev.endpointsByType[type].path)
              ? opt?.defaultPath ?? prev.endpointsByType[type].path
              : prev.endpointsByType[type].path,
        },
      },
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
            配置供应商展示样式与各类型 API 端点（路径 + 请求格式）。
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
                <p className="text-xs font-medium">类型配置</p>
                <p className="text-[10px] text-muted-foreground">不同类型可独立配置展示样式与 API 端点</p>
              </div>
              <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as ProviderModelType)} className="w-full">
                <TabsList className="grid grid-cols-3 h-8">
                  {MODEL_TYPES.map((t) => (
                    <TabsTrigger key={t} value={t} className="text-xs">
                      {TYPE_LABEL[t]}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {MODEL_TYPES.map((t) => (
                  <TabsContent key={t} value={t} className="pt-3 space-y-4">
                    <EndpointFields
                      type={t}
                      cfg={form.endpointsByType[t]}
                      onChangeFormat={(v) => selectFormat(t, v)}
                      onChange={(key, value) => updateEndpoint(t, key, value)}
                      disabled={submitting}
                    />
                    <div className="border-t border-border/50 pt-3">
                      <TypeUIFields
                        type={t}
                        ui={form.uiByType[t]}
                        onChange={(key, value) => updateTypeUI(t, key, value)}
                        disabled={submitting}
                      />
                    </div>
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

function EndpointFields({
  type,
  cfg,
  onChangeFormat,
  onChange,
  disabled,
}: {
  type: ProviderModelType
  cfg: EndpointCfg
  onChangeFormat: (value: string) => void
  onChange: (key: keyof EndpointCfg, value: string) => void
  disabled?: boolean
}) {
  const options = FORMAT_OPTIONS[type]
  const isAsyncVideo = type === "video" && ["sora", "kling", "jimeng"].includes(cfg.format)
  const isSora = type === "video" && cfg.format === "sora"

  return (
    <div className="space-y-2 rounded-md bg-background/40 p-2.5 ring-1 ring-border/40">
      <p className="text-[11px] font-medium text-muted-foreground">API 端点</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label className="text-xs">请求格式</Label>
          <Select value={cfg.format} onValueChange={onChangeFormat} disabled={disabled}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={`ep-path-${type}`} className="text-xs">
            创建路径
          </Label>
          <Input
            id={`ep-path-${type}`}
            value={cfg.path}
            onChange={(e) => onChange("path", e.target.value)}
            disabled={disabled}
            className="h-7 text-xs font-mono"
            placeholder={options[0].defaultPath}
          />
        </div>
      </div>
      {isAsyncVideo && (
        <>
          <div className="flex flex-col gap-1">
            <Label htmlFor={`ep-poll-${type}`} className="text-xs">
              轮询路径（可选）
            </Label>
            <Input
              id={`ep-poll-${type}`}
              value={cfg.pollPath}
              onChange={(e) => onChange("pollPath", e.target.value)}
              disabled={disabled}
              className="h-7 text-xs font-mono"
              placeholder="留空使用格式默认；支持 {taskId} 占位符"
            />
            <p className="text-[10px] text-muted-foreground">视频任务为异步，将定时轮询此路径以获取最新状态</p>
          </div>
          {isSora && (
            <div className="flex flex-col gap-1">
              <Label htmlFor={`ep-content-${type}`} className="text-xs">
                获取内容路径（Sora 特定）
              </Label>
              <Input
                id={`ep-content-${type}`}
                value={cfg.contentPath ?? ""}
                onChange={(e) => onChange("contentPath", e.target.value)}
                disabled={disabled}
                className="h-7 text-xs font-mono"
                placeholder="例：/v1/videos/{taskId}/content 或 /videos/{taskId}/download"
              />
              <p className="text-[10px] text-muted-foreground">Sora 获取视频文件的 API 路径，支持 {'{taskId}'} 占位符</p>
            </div>
          )}
        </>
      )}
    </div>
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
