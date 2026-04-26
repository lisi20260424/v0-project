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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MODEL_TYPES, MODEL_TYPE_LABELS, type ModelType } from "@/lib/admin"
import type { AdminPrompt } from "@/components/admin/prompts-manager"

type FormState = {
  id?: string
  modelType: ModelType
  title: string
  content: string
  category: string
  enabled: boolean
  sortOrder: number
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  prompt?: AdminPrompt
  defaultModelType?: ModelType
  onSave: (form: FormState) => Promise<void>
}

export function PromptDialog({ open, onOpenChange, prompt, defaultModelType = "video", onSave }: Props) {
  const isEdit = !!prompt
  const [form, setForm] = useState<FormState>(() => initial(prompt, defaultModelType))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm(initial(prompt, defaultModelType))
      setError(null)
    }
  }, [open, prompt, defaultModelType])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (!form.title.trim()) {
      setError("请填写提示词标题")
      return
    }
    if (!form.content.trim()) {
      setError("请填写提示词内容")
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
          <DialogTitle>{isEdit ? "编辑提示词" : "新建提示词"}</DialogTitle>
          <DialogDescription>启用后会出现在对应模型类型的生成页面，作为快捷提示词供用户一键填入。</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-type">适用类型</Label>
              <Select value={form.modelType} onValueChange={(v) => update("modelType", v as ModelType)} disabled={submitting}>
                <SelectTrigger id="p-type">
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
              <Label htmlFor="p-cat">分类标签（可选）</Label>
              <Input
                id="p-cat"
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                placeholder="例如：风景 / 人像 / 电影感"
                disabled={submitting}
                maxLength={20}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-title">标题</Label>
            <Input
              id="p-title"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="一句话描述提示词主题"
              disabled={submitting}
              maxLength={48}
              required
            />
            <p className="text-[11px] text-muted-foreground tabular-nums">{form.title.length} / 48</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-content">提示词内容</Label>
            <Textarea
              id="p-content"
              rows={6}
              value={form.content}
              onChange={(e) => update("content", e.target.value)}
              placeholder="完整的提示词内容，将填入用户的生成输入框"
              disabled={submitting}
              maxLength={2000}
              required
            />
            <p className="text-[11px] text-muted-foreground tabular-nums">{form.content.length} / 2000</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-sort">排序权重</Label>
              <Input
                id="p-sort"
                type="number"
                step={1}
                value={form.sortOrder}
                onChange={(e) => update("sortOrder", Number(e.target.value))}
                disabled={submitting}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4">
              <Label htmlFor="p-enabled" className="text-sm font-medium">
                启用提示词
              </Label>
              <Switch
                id="p-enabled"
                checked={form.enabled}
                onCheckedChange={(v) => update("enabled", v)}
                disabled={submitting}
              />
            </div>
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
              {submitting ? "保存中..." : isEdit ? "保存更改" : "创建提示词"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function initial(prompt: AdminPrompt | undefined, defaultModelType: ModelType): FormState {
  if (prompt) {
    return {
      id: prompt.id,
      modelType: prompt.model_type,
      title: prompt.title,
      content: prompt.content,
      category: prompt.category ?? "",
      enabled: prompt.enabled,
      sortOrder: prompt.sort_order,
    }
  }
  return {
    modelType: defaultModelType,
    title: "",
    content: "",
    category: "",
    enabled: true,
    sortOrder: 0,
  }
}
