"use client"

import { useState, useEffect } from "react"
import { Plus, Edit2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface Provider {
  id: string
  name: string
  type: string
  active: boolean
  created_at: string
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      const res = await fetch("/api/admin/providers")
      if (!res.ok) throw new Error("Failed to fetch providers")
      const data = await res.json()
      setProviders(data.providers || [])
    } catch (error) {
      console.error("[v0] Failed to fetch providers:", error)
      toast.error("获取供应商列表失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">供应商配置</h1>
          <p className="mt-1 text-sm text-muted-foreground">管理平台集成的 AI 供应商和配置</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          添加供应商
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">加载中...</p>
          </div>
        ) : providers.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">暂无供应商配置</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-sm font-semibold">名称</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">类型</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">状态</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">操作</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((provider) => (
                  <tr key={provider.id} className="border-b border-border hover:bg-muted/50">
                    <td className="px-6 py-3 text-sm font-medium">{provider.name}</td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">{provider.type}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-medium ${provider.active ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${provider.active ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                        {provider.active ? "已启用" : "已禁用"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
