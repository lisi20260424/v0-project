"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft, Plug, Cpu, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

type NavItem = {
  label: string
  href: string
  icon: typeof Plug
  desc: string
}

const ADMIN_ITEMS: NavItem[] = [
  { label: "API 网关", href: "/admin/settings/gateway", icon: Plug, desc: "密钥与网关地址" },
  { label: "模型配置", href: "/admin/settings/models", icon: Cpu, desc: "管理平台可用模型" },
  { label: "提示词配置", href: "/admin/settings/prompts", icon: Sparkles, desc: "快捷提示词管理" },
]

export function AdminSettingsNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-4">
      <Link
        href="/settings"
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        返回账户设置
      </Link>

      <div className="flex flex-col gap-1">
        <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">后台配置</p>
        {ADMIN_ITEMS.map((item) => {
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
              <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-[11px] text-muted-foreground">{item.desc}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
