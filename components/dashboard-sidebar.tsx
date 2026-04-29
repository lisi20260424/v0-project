"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ListChecks,
  Images,
  CreditCard,
  Receipt,
  Settings,
  Gift,
  HelpCircle,
  Plug,
  Cpu,
  Sparkles,
  Users,
} from "lucide-react"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useUser } from "@/components/user-provider"

type SidebarItem = {
  href: string
  label: string
  icon: typeof LayoutDashboard
  badge?: string
}

type SidebarSection = {
  label: string
  items: SidebarItem[]
}

const sections: SidebarSection[] = [
  {
    label: "工作台",
    items: [
      { href: "/dashboard", label: "概览", icon: LayoutDashboard },
      { href: "/tasks", label: "我的任务", icon: ListChecks },
      { href: "/creations", label: "我的创作", icon: Images },
    ],
  },
  {
    label: "账户",
    items: [
      { href: "/billing", label: "订阅与账单", icon: CreditCard },
      { href: "/orders", label: "消费记录", icon: Receipt },
      { href: "/invite", label: "邀请好友", icon: Gift, badge: "NEW" },
    ],
  },
  {
    label: "其他",
    items: [
      { href: "/settings", label: "账户设置", icon: Settings },
      { href: "/help", label: "帮助中心", icon: HelpCircle },
    ],
  },
]

const ADMIN_SECTION: SidebarSection = {
  label: "系统设置",
  items: [
    { href: "/admin-settings/providers", label: "供应商配置", icon: Sparkles },
    { href: "/admin-settings/models", label: "模型配置", icon: Cpu },
    { href: "/admin-settings/prompts", label: "提示词配置", icon: Sparkles },
    { href: "/admin-settings/users", label: "用户管理", icon: Users },
    { href: "/admin-settings/system-settings", label: "系统设置", icon: Plug },
  ],
}

export function DashboardSidebar() {
  const pathname = usePathname()
  const { isAdmin, user, refreshUser } = useUser()
  const [runningCount, setRunningCount] = React.useState<number | null>(null)

  // 获取运行中任务数
  React.useEffect(() => {
    if (!user?.id) return
    const fetchRunningCount = async () => {
      try {
        const res = await fetch("/api/tasks")
        const json = await res.json()
        const tasks = json.tasks || []
        const count = tasks.filter((t: any) => t.status === "running" || t.status === "queued").length
        setRunningCount(count)
      } catch (err) {
        console.error("[v0] Failed to fetch running tasks count:", err)
      }
    }
    
    fetchRunningCount()
    // 每 10 秒刷新一次
    const interval = setInterval(fetchRunningCount, 10000)
    return () => clearInterval(interval)
  }, [user?.id])

  // 监听用户交互，保持会话活跃
  React.useEffect(() => {
    let inactivityTimeout: NodeJS.Timeout
    
    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimeout)
      // 30 分钟无操作后刷新用户信息
      inactivityTimeout = setTimeout(() => {
        refreshUser()
      }, 30 * 60 * 1000)
    }

    const events = ['mousedown', 'keydown', 'touchstart', 'click']
    events.forEach(event => {
      window.addEventListener(event, resetInactivityTimer)
    })

    resetInactivityTimer()

    return () => {
      clearTimeout(inactivityTimeout)
      events.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer)
      })
    }
  }, [refreshUser])

  return (
    <nav aria-label="用户中心导航" className="rounded-2xl border border-border bg-card p-3">
      {sections.map((section) => (
        <div key={section.label} className="mb-3">
          <div className="px-3 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {section.label}
          </div>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              // 对"我的任务"添加动态 badge
              let badge = item.badge
              if (item.href === "/tasks" && runningCount !== null && runningCount > 0) {
                badge = String(runningCount)
              }
              return <SidebarLink key={item.href} item={{ ...item, badge }} pathname={pathname} />
            })}
          </ul>
        </div>
      ))}

      {isAdmin && (
        <div className="border-t border-border pt-3 mt-3">
          <div className="px-3 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {ADMIN_SECTION.label}
          </div>
          <ul className="space-y-0.5">
            {ADMIN_SECTION.items.map((item) => (
              <SidebarLink key={item.href} item={item} pathname={pathname} />
            ))}
          </ul>
        </div>
      )}
    </nav>
  )
}

function SidebarLink({ item, pathname }: { item: SidebarItem; pathname: string }) {
  const Icon = item.icon
  
  // 对于后台设置的菜单项，使用精确匹配；其他菜单项支持前缀匹配
  const isAdminItem = item.href.startsWith("/admin-settings/")
  const active = isAdminItem 
    ? pathname === item.href 
    : pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`))

  return (
    <li>
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
        {item.badge && (
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
}
