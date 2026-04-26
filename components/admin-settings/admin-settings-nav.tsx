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
    <nav className="rounded-2xl border border-border bg-card p-3">
      <div className="flex flex-col gap-1">
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-start gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-colors",
                active ? "border-border bg-secondary" : "hover:border-border hover:bg-secondary/60",
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className={cn("text-sm font-medium", active && "text-primary")}>{item.label}</span>
                <span className="text-[11px] text-muted-foreground">{item.desc}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
