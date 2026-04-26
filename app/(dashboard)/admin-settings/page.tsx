"use client"

import Link from "next/link"
import { Plug, Cpu, Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type AdminSettingItem = {
  title: string
  description: string
  icon: typeof Plug
  href: string
  status: "active" | "inactive"
  count?: number
}

const ADMIN_SETTINGS: AdminSettingItem[] = [
  {
    title: "API 网关",
    description: "配置 API 网关地址和密钥，管理平台的 AI 模型网关",
    icon: Plug,
    href: "/admin-settings/gateway",
    status: "active",
  },
  {
    title: "模型配置",
    description: "添加、编辑和管理平台可用的 AI 模型，控制模型的启用状态和定价",
    icon: Cpu,
    href: "/admin-settings/models",
    status: "active",
    count: 8,
  },
  {
    title: "提示词配置",
    description: "创建和管理快捷提示词，供用户在生成任务时快速选择",
    icon: Sparkles,
    href: "/admin-settings/prompts",
    status: "active",
    count: 12,
  },
]

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">后台设置</h1>
        <p className="mt-1 text-sm text-muted-foreground">管理 API 网关、模型配置和提示词</p>
      </div>

      <div className="space-y-3">
        {ADMIN_SETTINGS.map((item) => (
          <SettingCard key={item.href} item={item} />
        ))}
      </div>
    </div>
  )
}

function SettingCard({ item }: { item: AdminSettingItem }) {
  const Icon = item.icon
  const isActive = item.status === "active"

  return (
    <Link href={item.href}>
      <article className="group overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40">
        <div className="flex gap-4 p-6">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/10">
            <Icon className="h-8 w-8 text-primary" />
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
              </div>
              <div className="flex items-center gap-3">
                {item.count !== undefined && (
                  <div className="rounded-lg bg-primary/10 px-3 py-1 text-center">
                    <div className="text-sm font-bold text-primary">{item.count}</div>
                    <div className="text-[10px] text-muted-foreground">已配置</div>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 group-hover:bg-primary/10"
                  asChild
                >
                  <div className="flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Button>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center rounded-full px-2 py-1 text-[11px] font-medium">
                <span className={cn("h-1.5 w-1.5 rounded-full mr-1.5", isActive ? "bg-emerald-500" : "bg-muted-foreground")} />
                {isActive ? "已启用" : "已禁用"}
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
