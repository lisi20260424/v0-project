"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plug, Clock, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

type NavItem = {
  label: string
  href: string
  icon: typeof Plug
  desc: string
}

const ITEMS: NavItem[] = [
  {
    label: "API 网关",
    href: "/admin-settings/system-settings/gateway",
    icon: Plug,
    desc: "网关地址与密钥",
  },
  {
    label: "生成配置",
    href: "/admin-settings/system-settings/generation",
    icon: Clock,
    desc: "生成任务超时",
  },
  {
    label: "支付配置",
    href: "/admin-settings/system-settings/payment",
    icon: Wallet,
    desc: "收钱吧聚合支付",
  },
]

export function SystemSettingsNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1">
      <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        系统设置
      </p>
      {ITEMS.map((item) => {
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
            <Icon
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0",
                active ? "text-primary" : "text-muted-foreground",
              )}
            />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-medium">{item.label}</span>
              <span className="text-[11px] text-muted-foreground">{item.desc}</span>
            </div>
          </Link>
        )
      })}
    </nav>
  )
}
