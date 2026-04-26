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
import type { AdminProvider } from "@/components/admin/providers-manager"

type FormState = {
  id?: string
  name: string
  displayName: string
  description: string
  enabled: boolean
  sortOrder: number
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider?: AdminProvider
  onSave: (form: FormState) => Promise<void>
}

function initial(provider?: AdminProvider): FormState {
  if (!provider) {
    return {
      name: "",
      displayName: "",
      description: "",
      enabled: true,
      sortOrder: 0,
    }
  }
  return {
    id: provider.id,
    name: provider.name,
    displayName: provider.display_name,
    description: provider.description ?? "",
    enabled: provider.enabled,
    sortOrder: provider.sort_order,
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
      <DialogContent className="flex max-h-[90vh] w-full flex-col max-w-md">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{isEdit ? "编辑供应商" : "新建供应商"}</DialogTitle>
          <DialogDescription>
            配置 AI 模型供应商信息。编辑后立即生效。
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

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-name" className="text-xs font-medium">
                供应商标识
              </Label>
              <Input
                id="p-name"
                size="sm"
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
                size="sm"
                value={form.displayName}
                onChange={(e) => update("displayName", e.target.value)}
                placeholder="例如：OpenAI"
                disabled={submitting}
                required
                className="h-8 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-desc" className="text-xs font-medium">
                描述
              </Label>
              <Textarea
                id="p-desc"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="供应商描述"
                disabled={submitting}
                className="text-sm"
                rows={3}
              />
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
