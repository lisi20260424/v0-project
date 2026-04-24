"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ListChecks,
  Images,
  CreditCard,
  Receipt,
  Key,
  Settings,
  Gift,
  HelpCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

const sections = [
  {
    label: "工作台",
    items: [
      { href: "/dashboard", label: "概览", icon: LayoutDashboard },
      { href: "/tasks", label: "我的任务", icon: ListChecks, badge: "3" },
      { href: "/creations", label: "我的创作", icon: Images },
    ],
  },
  {
    label: "账户",
    items: [
      { href: "/billing", label: "订阅与账单", icon: CreditCard },
      { href: "/orders", label: "消费记录", icon: Receipt },
      { href: "/invite", label: "邀请好友", icon: Gift, badge: "NEW" },
      { href: "/api-keys", label: "API 密钥", icon: Key },
    ],
  },
  {
    label: "其他",
    items: [
      { href: "/settings", label: "账户设置", icon: Settings },
      { href: "/help", label: "帮助中心", icon: HelpCircle },
    ],
  },
] as const

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <nav aria-label="用户中心导航" className="rounded-2xl border border-border bg-card p-3">
      {sections.map((section) => (
        <div key={section.label} className="mb-3 last:mb-0">
          <div className="px-3 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {section.label}
          </div>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`))
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-foreground/80 hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1">{item.label}</span>
                    {"badge" in item && item.badge && (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                          item.badge === "NEW"
                            ? "bg-accent/15 text-accent"
                            : "bg-primary/15 text-primary tabular-nums",
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
