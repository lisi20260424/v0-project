"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ListChecks, Images, CreditCard, Settings, Cpu, Sparkles, Users, Plug } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@/components/user-provider"

type SidebarItem = {
  href: string
  label: string
  icon: typeof LayoutDashboard
}

const USER_ITEMS: SidebarItem[] = [
  { href: "/dashboard", label: "工作台", icon: LayoutDashboard },
  { href: "/tasks", label: "我的任务", icon: ListChecks },
  { href: "/creations", label: "我的创作", icon: Images },
  { href: "/billing", label: "订阅与账单", icon: CreditCard },
  { href: "/settings", label: "账户设置", icon: Settings },
]

const ADMIN_ITEMS: SidebarItem[] = [
  { href: "/admin-settings/providers", label: "供应商配置", icon: Sparkles },
  { href: "/admin-settings/models", label: "模型配置", icon: Cpu },
  { href: "/admin-settings/prompts", label: "提示词配置", icon: Sparkles },
  { href: "/admin-settings/users", label: "用户管理", icon: Users },
  { href: "/admin-settings/system-settings", label: "系统设置", icon: Plug },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { isAdmin } = useUser()
  const items = isAdmin ? [...USER_ITEMS, ...ADMIN_ITEMS] : USER_ITEMS

  return (
    <nav aria-label="用户中心导航" className="rounded-2xl border border-border bg-card p-3">
      <div className="px-3 pb-2 pt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        用户中心
      </div>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  active ? "bg-primary/10 font-medium text-primary" : "text-foreground/80 hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
