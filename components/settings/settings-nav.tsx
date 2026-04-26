"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, ShieldCheck, SlidersHorizontal, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

type NavItem = {
  label: string
  href: string
  icon: typeof User
  desc: string
  danger?: boolean
}

const ACCOUNT_ITEMS: NavItem[] = [
  { label: "个人资料", href: "/settings/profile", icon: User, desc: "头像、昵称、简介" },
  { label: "账户安全", href: "/settings/security", icon: ShieldCheck, desc: "密码、邮箱、会话" },
  { label: "偏好设置", href: "/settings/preferences", icon: SlidersHorizontal, desc: "默认模型、通知" },
  { label: "账号注销", href: "/settings/danger", icon: Trash2, desc: "永久删除账户", danger: true },
]

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1">
      <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">账户设置</p>
      {ACCOUNT_ITEMS.map((item) => (
        <NavLink key={item.href} item={item} active={pathname === item.href} />
      ))}
    </nav>
  )
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-start gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-colors",
        active ? "border-border bg-secondary" : "hover:border-border hover:bg-secondary/60",
        item.danger && active && "border-destructive/30 bg-destructive/5",
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          active ? (item.danger ? "text-destructive" : "text-primary") : "text-muted-foreground",
        )}
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className={cn("text-sm font-medium", item.danger && active && "text-destructive")}>{item.label}</span>
        <span className="text-[11px] text-muted-foreground">{item.desc}</span>
      </div>
    </Link>
  )
}
