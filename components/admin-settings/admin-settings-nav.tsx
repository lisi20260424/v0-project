"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plug, Cpu, Sparkles, ChevronRight, Globe, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

type AdminNavItem = {
  label: string
  href: string
  icon: typeof Plug
  desc: string
  children?: { label: string; href: string; desc: string }[]
}

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    label: "系统设置",
    href: "/admin-settings/system-settings",
    icon: Plug,
    desc: "网关和生成配置",
    children: [
      { label: "API 网关", href: "/admin-settings/system-settings/gateway", desc: "网关地址与密钥" },
      { label: "生成配置", href: "/admin-settings/system-settings/generation", desc: "生成任务超时时间" },
      { label: "支付配置", href: "/admin-settings/system-settings/payment", desc: "收钱吧聚合支付" },
    ],
  },
  { label: "供应商配置", href: "/admin-settings/providers", icon: Globe, desc: "管理模型供应商" },
  { label: "模型配置", href: "/admin-settings/models", icon: Cpu, desc: "管理可用模型" },
  { label: "提示词配置", href: "/admin-settings/prompts", icon: Sparkles, desc: "快捷提示词" },
  { label: "用户管理", href: "/admin-settings/users", icon: Users, desc: "管理用户与会员" },
]

export function AdminSettingsNav() {
  const pathname = usePathname()
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  return (
    <nav className="space-y-2">
      {ADMIN_NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const active = pathname === item.href || pathname.startsWith(item.href + "/")
        const hasChildren = item.children && item.children.length > 0

        return (
          <div key={item.href}>
            {hasChildren ? (
              <button
                onClick={() => setExpandedItem(expandedItem === item.href ? null : item.href)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg border px-4 py-3 transition-all",
                  active ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40 hover:bg-secondary",
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/10">
                  <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className={cn("text-sm font-medium", active && "text-primary")}>{item.label}</div>
                  <div className="text-[11px] text-muted-foreground">{item.desc}</div>
                </div>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform shrink-0",
                    expandedItem === item.href && "rotate-90",
                  )}
                />
              </button>
            ) : (
              <Link
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
            )}

            {hasChildren && expandedItem === item.href && (
              <div className="mt-2 ml-4 space-y-1 border-l border-border/50 pl-4">
                {item.children.map((child) => {
                  const childActive = pathname === child.href
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        "block rounded-lg border px-3 py-2.5 transition-all text-sm",
                        childActive
                          ? "border-primary/30 bg-primary/5 font-medium text-primary"
                          : "border-transparent bg-transparent text-foreground/70 hover:bg-secondary/50",
                      )}
                    >
                      <div className={cn("text-sm", childActive && "font-medium")}>{child.label}</div>
                      <div className="text-[10px] text-muted-foreground">{child.desc}</div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}
