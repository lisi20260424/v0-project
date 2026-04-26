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
      <DialogContent className="flex max-h-[90vh] w-full flex-col max-w-2xl">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{isEdit ? "编辑提示词" : "新建提示词"}</DialogTitle>
          <DialogDescription>启用后会出现在对应模型类型的生成页面，作为快捷提示词供用户一键填入。</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-col gap-3">
          {/* 可滚动的表单内容区 */}
          <div className="min-h-0 flex-1 overflow-y-auto px-1 pr-3 space-y-3">
            {/* 适用类型 */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="p-type" className="text-xs font-medium">
                  适用类型
                </Label>
                <Select
                  value={form.modelType}
                  onValueChange={(v) => update("modelType", v as ModelType)}
                  disabled={submitting}
                >
                  <SelectTrigger id="p-type" className="h-8 text-sm">
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
                <Label htmlFor="p-category" className="text-xs font-medium">
                  分类标签
                </Label>
                <Input
                  id="p-category"
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                  placeholder="例如：创意、风景、人物"
                  disabled={submitting}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* 提示词标题 */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-title" className="text-xs font-medium">
                提示词标题
              </Label>
              <Input
                id="p-title"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="向用户展示的提示词名称"
                disabled={submitting}
                required
                className="h-8 text-sm"
              />
            </div>

            {/* 提示词内容 */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-content" className="text-xs font-medium">
                提示词内容
              </Label>
              <Textarea
                id="p-content"
                rows={4}
                value={form.content}
                onChange={(e) => update("content", e.target.value)}
                placeholder="用户点击此提示词时会自动填入生成页面的提示词输入框"
                disabled={submitting}
                required
                className="text-sm resize-none"
              />
            </div>

            {/* 排序权重 */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-sort" className="text-xs font-medium">
                排序权重
              </Label>
              <Input
                id="p-sort"
                type="number"
                step={1}
                value={form.sortOrder}
                onChange={(e) => update("sortOrder", Number(e.target.value))}
                disabled={submitting}
                className="h-8 text-sm"
              />
            </div>

            {/* 启用状态 */}
            <div className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/20 px-3 py-2.5">
              <div className="flex flex-col gap-0.5">
                <Label htmlFor="p-enabled" className="text-xs font-medium">
                  启用提示词
                </Label>
                <span className="text-[10px] text-muted-foreground">停用后不会出现在生成页面中</span>
              </div>
              <Switch
                id="p-enabled"
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
