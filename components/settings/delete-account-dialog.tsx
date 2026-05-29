"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { platformAPI } from "@/lib/platform-api"

export function DeleteAccountDialog({ email }: { email: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canDelete = confirmText === "DELETE"

  async function onDelete() {
    if (!canDelete) return
    setError(null)
    setLoading(true)
    try {
      const token = localStorage.getItem("accessToken") ?? ""
      if (!token) throw new Error("请先登录后再试")
      await platformAPI.deleteAccount(token)
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
      setOpen(false)
      router.push("/")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败，请联系客服")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">永久删除我的账号</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div className="flex flex-col gap-0.5 text-left">
              <DialogTitle>确认永久删除账号？</DialogTitle>
              <DialogDescription>此操作不可撤销</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-3 text-sm">
          <p className="text-muted-foreground">删除账号后，以下数据将被永久清除：</p>
          <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
            <li>账号信息与绑定关系（{email}）</li>
            <li>所有生成任务与作品记录</li>
            <li>未使用的点数余额和会员权益</li>
            <li>订单记录将脱敏后保留用于财务审计</li>
          </ul>

          <div className="flex flex-col gap-1.5 pt-2">
            <Label htmlFor="confirm_text" className="text-xs">
              请输入大写的 <span className="font-mono font-bold text-foreground">DELETE</span> 确认删除
            </Label>
            <Input
              id="confirm_text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              disabled={loading}
            />
          </div>

          {error ? (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            取消
          </Button>
          <Button variant="destructive" onClick={onDelete} disabled={!canDelete || loading}>
            {loading ? <Spinner className="mr-2 h-4 w-4" /> : null}
            {loading ? "删除中..." : "确认删除"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
