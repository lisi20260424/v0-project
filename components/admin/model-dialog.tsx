"use client"

import { useEffect, useMemo, useState } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  MODEL_CONFIG_SCHEMA,
  MODEL_TYPE_LABELS,
  MODEL_TYPES,
  type ModelConfigField,
  type ModelType,
} from "@/lib/admin"
import type { AdminModel } from "@/components/admin/models-manager"

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

  useEffect(() => {
    if (open) {
      setForm(initial(model, defaultModelType))
      setError(null)
    }
  }, [open, model, defaultModelType])

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
      setError("请填写模型供应商")
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "编辑模型" : "新建模型"}</DialogTitle>
          <DialogDescription>
            配置模型基本信息和对应类型的生成参数。修改后将立即对所有用户生效。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="m-name">模型名称</Label>
              <Input
                id="m-name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="例如：Sora Turbo"
                disabled={submitting}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="m-provider">模型供应商</Label>
              <Input
                id="m-provider"
                value={form.provider}
                onChange={(e) => update("provider", e.target.value)}
                placeholder="例如：OpenAI"
                disabled={submitting}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="m-type">模型类型</Label>
              <Select value={form.modelType} onValueChange={(v) => changeModelType(v as ModelType)} disabled={submitting}>
                <SelectTrigger id="m-type">
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
              <Label htmlFor="m-billing">计费类型</Label>
              <Select value="per_use" disabled>
                <SelectTrigger id="m-billing">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_use">按次计费</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="m-cost">单次消耗（点）</Label>
              <Input
                id="m-cost"
                type="number"
                min={0}
                step={1}
                value={Number.isFinite(form.costPerUse) ? form.costPerUse : 0}
                onChange={(e) => update("costPerUse", Number(e.target.value))}
                disabled={submitting}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="m-sort">排序权重</Label>
              <Input
                id="m-sort"
                type="number"
                step={1}
                value={form.sortOrder}
                onChange={(e) => update("sortOrder", Number(e.target.value))}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="m-desc">模型描述</Label>
            <Textarea
              id="m-desc"
              rows={2}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="向用户说明该模型的特点、适用场景"
              disabled={submitting}
            />
          </div>

          {fields.length > 0 ? (
            <div className="rounded-lg border border-border bg-secondary/30 p-4">
              <p className="mb-3 text-sm font-medium">{MODEL_TYPE_LABELS[form.modelType]} · 基础参数</p>
              <div className="grid gap-3 md:grid-cols-2">
                {fields.map((field) => (
                  <ConfigFieldInput
                    key={field.key}
                    field={field}
                    value={form.config[field.key]}
                    onChange={(v) => updateConfig(field.key, v)}
                    disabled={submitting}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="m-enabled" className="text-sm font-medium">
                启用模型
              </Label>
              <span className="text-[11px] text-muted-foreground">停用后该模型不会出现在生成页面中</span>
            </div>
            <Switch
              id="m-enabled"
              checked={form.enabled}
              onCheckedChange={(v) => update("enabled", v)}
              disabled={submitting}
            />
          </div>

          {error ? (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
              取消
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Spinner className="mr-2 h-4 w-4" /> : null}
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
}: {
  field: ModelConfigField
  value: unknown
  onChange: (v: unknown) => void
  disabled?: boolean
}) {
  if (field.type === "select" && field.options) {
    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`f-${field.key}`}>{field.label}</Label>
        <Select
          value={value !== undefined && value !== null ? String(value) : ""}
          onValueChange={(v) => onChange(v)}
          disabled={disabled}
        >
          <SelectTrigger id={`f-${field.key}`}>
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
      </div>
    )
  }

  if (field.type === "number") {
    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`f-${field.key}`}>{field.label}</Label>
        <Input
          id={`f-${field.key}`}
          type="number"
          value={value === undefined || value === null ? "" : String(value)}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
          placeholder={field.placeholder}
          disabled={disabled}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`f-${field.key}`}>{field.label}</Label>
      <Input
        id={`f-${field.key}`}
        type="text"
        value={value === undefined || value === null ? "" : String(value)}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        disabled={disabled}
      />
    </div>
  )
}
