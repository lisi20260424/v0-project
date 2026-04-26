"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plug, Cpu, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

type AdminNavItem = {
  label: string
  href: string
  icon: typeof Plug
  desc: string
}

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "API 网关", href: "/admin-settings/gateway", icon: Plug, desc: "网关地址与密钥" },
  { label: "模型配置", href: "/admin-settings/models", icon: Cpu, desc: "管理可用模型" },
  { label: "提示词配置", href: "/admin-settings/prompts", icon: Sparkles, desc: "快捷提示词" },
]

export function AdminSettingsNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-2">
      {ADMIN_NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-4 py-3 transition-all",
              active
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/40 hover:bg-secondary",
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/10">
              <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={cn("text-sm font-medium", active && "text-primary")}>{item.label}</div>
              <div className="text-[11px] text-muted-foreground">{item.desc}</div>
            </div>
          </Link>
        )
      })}
    </nav>
  )
}
