"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertCircle, Loader2 } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  MODEL_CONFIG_SCHEMA,
  MODEL_TYPE_LABELS,
  MODEL_TYPES,
  type ModelConfigField,
  type ModelType,
} from "@/lib/admin"
import type { AdminModel } from "@/components/admin/models-manager"

type Provider = {
  id: string
  name: string
  display_name: string
}

type FormState = {
  id?: string
  name: string
  provider: string
  modelType: ModelType
  costPerUse: number
  description: string
  config: Record<string, unknown>
  enabled: boolean
  sortOrder: number
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  model?: AdminModel
  defaultModelType?: ModelType
  onSave: (form: FormState) => Promise<void>
}

function buildDefaultConfig(modelType: ModelType): Record<string, unknown> {
  const fields = MODEL_CONFIG_SCHEMA[modelType]
  const out: Record<string, unknown> = {}
  for (const f of fields) {
    if (f.defaultValue !== undefined) out[f.key] = f.defaultValue
  }
  return out
}

export function ModelDialog({ open, onOpenChange, model, defaultModelType = "video", onSave }: Props) {
  const isEdit = !!model
  const [form, setForm] = useState<FormState>(() => initial(model, defaultModelType))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loadingProviders, setLoadingProviders] = useState(true)

  useEffect(() => {
    if (open) {
      setForm(initial(model, defaultModelType))
      setError(null)
      loadProviders()
    }
  }, [open, model, defaultModelType])

  async function loadProviders() {
    setLoadingProviders(true)
    try {
      const res = await fetch("/api/admin/providers")
      const json = await res.json()
      setProviders(json.providers ?? [])
    } catch (err) {
      console.error("加载供应商失败:", err)
    } finally {
      setLoadingProviders(false)
    }
  }

  const fields: ModelConfigField[] = useMemo(() => MODEL_CONFIG_SCHEMA[form.modelType] ?? [], [form.modelType])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateConfig(key: string, value: unknown) {
    setForm((prev) => ({ ...prev, config: { ...prev.config, [key]: value } }))
  }

  function changeModelType(t: ModelType) {
    setForm((prev) => ({
      ...prev,
      modelType: t,
      // 类型变化时重置配置为该类型的默认值
      config: prev.id && prev.modelType === t ? prev.config : buildDefaultConfig(t),
    }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (!form.name.trim()) {
      setError("请填写模型名称")
      return
    }
    if (!form.provider.trim()) {
      setError("请选择模型供应商")
      return
    }
    if (!Number.isFinite(form.costPerUse) || form.costPerUse < 0) {
      setError("单次消耗必须是非负数")
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
      <DialogContent className="flex max-h-[90vh] w-full flex-col max-w-2xl">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{isEdit ? "编辑模型" : "新建模型"}</DialogTitle>
          <DialogDescription>
            配置模型基本信息和对应类型的生成参数。修改后将立即对所有用户生效。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-col gap-4">
          {/* 可滚动的表单内容区 */}
          <div className="min-h-0 flex-1 overflow-y-auto px-1 pr-3 space-y-4">
            {/* 基础信息 */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="m-name" className="text-xs font-medium">
                  模型名称
                </Label>
                <Input
                  id="m-name"
                  size="sm"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="例如：Sora Turbo"
                  disabled={submitting}
                  required
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="m-provider" className="text-xs font-medium">
                  模型供应商
                </Label>
                <Select
                  value={form.provider}
                  onValueChange={(v) => update("provider", v)}
                  disabled={submitting || loadingProviders}
                >
                  <SelectTrigger id="m-provider" className="h-8 text-sm">
                    {loadingProviders ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>加载中...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder="选择供应商" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {providers.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        {loadingProviders ? "加载中..." : "暂无供应商"}
                      </div>
                    ) : (
                      providers.map((p) => (
                        <SelectItem key={p.id} value={p.name}>
                          {p.display_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="m-type" className="text-xs font-medium">
                  模型类型
                </Label>
                <Select
                  value={form.modelType}
                  onValueChange={(v) => changeModelType(v as ModelType)}
                  disabled={submitting}
                >
                  <SelectTrigger id="m-type" className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODEL_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {MODEL_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="m-cost" className="text-xs font-medium">
                  单次消耗（点）
                </Label>
                <Input
                  id="m-cost"
                  type="number"
                  min={0}
                  step={1}
                  value={Number.isFinite(form.costPerUse) ? form.costPerUse : 0}
                  onChange={(e) => update("costPerUse", Number(e.target.value))}
                  disabled={submitting}
                  required
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* 排序权重 */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="m-sort" className="text-xs font-medium">
                排序权重
              </Label>
              <Input
                id="m-sort"
                type="number"
                step={1}
                value={form.sortOrder}
                onChange={(e) => update("sortOrder", Number(e.target.value))}
                disabled={submitting}
                className="h-8 text-sm"
              />
            </div>

            {/* 模型描述 */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="m-desc" className="text-xs font-medium">
                模型描述
              </Label>
              <Textarea
                id="m-desc"
                rows={2}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="向用户说明该模型的特点、适用场景"
                disabled={submitting}
                className="text-sm resize-none"
              />
            </div>

            {/* 默认展示开关 */}
            <div className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/20 px-3 py-2.5">
              <div className="flex flex-col gap-0.5">
                <Label htmlFor="m-default-display" className="text-sm font-medium cursor-pointer">
                  作为该供应商在该类型下的默认展示模型
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  开启后，AI 工具菜单与首页 #tools 区域将以本模型名作为该供应商的代表
                </p>
              </div>
              <Switch
                id="m-default-display"
                checked={!!form.config.is_default_display}
                onCheckedChange={(v) => updateConfig("is_default_display", v)}
                disabled={submitting}
              />
            </div>

            {/* 类型特定参数 */}
            {fields.length > 0 ? (
              <div className="space-y-2 rounded-lg border border-border/50 bg-secondary/20 p-3">
                <p className="text-xs font-medium text-foreground">{MODEL_TYPE_LABELS[form.modelType]} · 生成参数</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {fields.map((field) => (
                    <ConfigFieldInput
                      key={field.key}
                      field={field}
                      value={form.config[field.key]}
                      onChange={(v) => updateConfig(field.key, v)}
                      disabled={submitting}
                      compact
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {/* 启用状态 */}
            <div className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/20 px-3 py-2.5">
              <div className="flex flex-col gap-0.5">
                <Label htmlFor="m-enabled" className="text-xs font-medium">
                  启用模型
                </Label>
                <span className="text-[10px] text-muted-foreground">停用后该模型不会出现在生成页面中</span>
              </div>
              <Switch
                id="m-enabled"
                checked={form.enabled}
                onCheckedChange={(v) => update("enabled", v)}
                disabled={submitting}
              />
            </div>

            {/* 错误提示 */}
            {error ? (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}
          </div>

          {/* 固定在底部的按钮 */}
          <DialogFooter className="flex-shrink-0 border-t border-border/50 pt-3">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting} size="sm">
              取消
            </Button>
            <Button type="submit" disabled={submitting} size="sm">
              {submitting ? <Spinner className="mr-2 h-3 w-3" /> : null}
              {submitting ? "保存中..." : isEdit ? "保存更改" : "创建模型"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function initial(model: AdminModel | undefined, defaultModelType: ModelType): FormState {
  if (model) {
    return {
      id: model.id,
      name: model.name,
      provider: model.provider,
      modelType: model.model_type,
      costPerUse: model.cost_per_use,
      description: model.description ?? "",
      config: { ...(model.config ?? {}) },
      enabled: model.enabled,
      sortOrder: model.sort_order,
    }
  }
  return {
    name: "",
    provider: "",
    modelType: defaultModelType,
    costPerUse: 1,
    description: "",
    config: buildDefaultConfig(defaultModelType),
    enabled: true,
    sortOrder: 0,
  }
}

function ConfigFieldInput({
  field,
  value,
  onChange,
  disabled,
  compact = false,
}: {
  field: ModelConfigField
  value: unknown
  onChange: (v: unknown) => void
  disabled?: boolean
  compact?: boolean
}) {
  const labelClass = compact ? "text-xs font-medium" : "text-sm font-medium"
  const inputClass = compact ? "h-7 text-xs" : "h-8 text-sm"
  const gapClass = compact ? "gap-1" : "gap-1.5"

  if (field.type === "boolean") {
    const checked = value === true || value === "true"
    return (
      <div className={`flex items-start justify-between gap-2 rounded-md border border-border/50 bg-background px-2.5 py-2 ${compact ? "md:col-span-2" : ""}`}>
        <div className={`flex flex-col ${gapClass} flex-1`}>
          <Label htmlFor={`f-${field.key}`} className={labelClass}>
            {field.label}
          </Label>
          {field.description ? (
            <span className="text-[10px] text-muted-foreground">{field.description}</span>
          ) : null}
        </div>
        <Switch
          id={`f-${field.key}`}
          checked={checked}
          onCheckedChange={(v) => onChange(v)}
          disabled={disabled}
        />
      </div>
    )
  }

  if (field.type === "select" && field.options) {
    return (
      <div className={`flex flex-col ${gapClass}`}>
        <Label htmlFor={`f-${field.key}`} className={labelClass}>
          {field.label}
        </Label>
        <Select
          value={value !== undefined && value !== null ? String(value) : ""}
          onValueChange={(v) => onChange(v)}
          disabled={disabled}
        >
          <SelectTrigger id={`f-${field.key}`} className={inputClass}>
            <SelectValue placeholder="请选择" />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {field.description ? (
          <span className="text-[10px] text-muted-foreground">{field.description}</span>
        ) : null}
      </div>
    )
  }

  if (field.type === "number") {
    return (
      <div className={`flex flex-col ${gapClass}`}>
        <Label htmlFor={`f-${field.key}`} className={labelClass}>
          {field.label}
        </Label>
        <Input
          id={`f-${field.key}`}
          type="number"
          value={value === undefined || value === null ? "" : String(value)}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
          placeholder={field.placeholder}
          disabled={disabled}
          className={inputClass}
        />
        {field.description ? (
          <span className="text-[10px] text-muted-foreground">{field.description}</span>
        ) : null}
      </div>
    )
  }

  if (field.type === "list") {
    return (
      <div className={`flex flex-col ${gapClass} ${compact ? "md:col-span-2" : ""}`}>
        <Label htmlFor={`f-${field.key}`} className={labelClass}>
          {field.label}
        </Label>
        <Input
          id={`f-${field.key}`}
          type="text"
          value={value === undefined || value === null ? "" : String(value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          className={inputClass}
        />
        {field.description ? (
          <span className="text-[10px] text-muted-foreground">{field.description}</span>
        ) : null}
      </div>
    )
  }

  return (
    <div className={`flex flex-col ${gapClass}`}>
      <Label htmlFor={`f-${field.key}`} className={labelClass}>
        {field.label}
      </Label>
      <Input
        id={`f-${field.key}`}
        type="text"
        value={value === undefined || value === null ? "" : String(value)}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        disabled={disabled}
        className={inputClass}
      />
      {field.description ? (
        <span className="text-[10px] text-muted-foreground">{field.description}</span>
      ) : null}
    </div>
  )
}
