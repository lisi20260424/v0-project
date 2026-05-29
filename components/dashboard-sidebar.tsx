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
import { platformAPI } from "@/lib/platform-api"

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
    label: "宸ヤ綔鍙?,
    items: [
      { href: "/dashboard", label: "姒傝", icon: LayoutDashboard },
      { href: "/tasks", label: "鎴戠殑浠诲姟", icon: ListChecks },
      { href: "/creations", label: "鎴戠殑鍒涗綔", icon: Images },
    ],
  },
  {
    label: "璐︽埛",
    items: [
      { href: "/billing", label: "璁㈤槄璁板綍", icon: CreditCard },
      { href: "/billing/records", label: "璐﹀崟璁板綍", icon: Receipt },
      { href: "/invite", label: "閭€璇峰ソ鍙?, icon: Gift, badge: "NEW" },
    ],
  },
  {
    label: "鍏朵粬",
    items: [
      { href: "/settings", label: "璐︽埛璁剧疆", icon: Settings },
      { href: "/help", label: "甯姪涓績", icon: HelpCircle },
    ],
  },
]

const ADMIN_SECTION: SidebarSection = {
  label: "绯荤粺璁剧疆",
  items: [
    { href: "/admin-settings/providers", label: "渚涘簲鍟嗛厤缃?, icon: Sparkles },
    { href: "/admin-settings/models", label: "妯″瀷閰嶇疆", icon: Cpu },
    { href: "/admin-settings/prompts", label: "鎻愮ず璇嶉厤缃?, icon: Sparkles },
    { href: "/admin-settings/users", label: "鐢ㄦ埛绠＄悊", icon: Users },
    { href: "/admin-settings/system-settings", label: "绯荤粺璁剧疆", icon: Plug },
  ],
}

export function DashboardSidebar() {
  const pathname = usePathname()
  const { isAdmin, user, refreshUser } = useUser()
  const [runningCount, setRunningCount] = React.useState<number | null>(null)

  // 鑾峰彇杩愯涓换鍔℃暟
  React.useEffect(() => {
    if (!user?.id) return
    const fetchRunningCount = async () => {
      try {
        const token = localStorage.getItem("accessToken") ?? ""
        if (!token) return
        const json = await platformAPI.listTasks(token)
        const tasks = json.data?.tasks || []
        const count = tasks.filter((t: any) => t.status === "running" || t.status === "queued").length
        setRunningCount(count)
      } catch (err) {
        console.error("[v0] Failed to fetch running tasks count:", err)
      }
    }
    
    fetchRunningCount()
    // 姣?10 绉掑埛鏂颁竴娆?
    const interval = setInterval(fetchRunningCount, 10000)
    return () => clearInterval(interval)
  }, [user?.id])

  // 鐩戝惉鐢ㄦ埛浜や簰锛屼繚鎸佷細璇濇椿璺?
  React.useEffect(() => {
    let inactivityTimeout: NodeJS.Timeout
    
    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimeout)
      // 30 鍒嗛挓鏃犳搷浣滃悗鍒锋柊鐢ㄦ埛淇℃伅
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
    <nav aria-label="鐢ㄦ埛涓績瀵艰埅" className="rounded-2xl border border-border bg-card p-3">
      {sections.map((section) => (
        <div key={section.label} className="mb-3">
          <div className="px-3 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {section.label}
          </div>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              // 瀵?鎴戠殑浠诲姟"娣诲姞鍔ㄦ€?badge
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

// 闇€瑕佺簿纭尮閰嶇殑鑿滃崟椤癸紙閬垮厤鍓嶇紑鍖归厤楂樹寒鐖剁骇锛?
const EXACT_MATCH_HREFS = new Set(["/dashboard", "/billing"])

function SidebarLink({ item, pathname }: { item: SidebarItem; pathname: string }) {
  const Icon = item.icon

  // 鍚庡彴璁剧疆鑿滃崟椤瑰拰 EXACT_MATCH_HREFS 涓殑椤癸紝浣跨敤绮剧‘鍖归厤锛涘叾浠栨敮鎸佸墠缂€鍖归厤
  const isAdminItem = item.href.startsWith("/admin-settings/")
  const isExactMatch = isAdminItem || EXACT_MATCH_HREFS.has(item.href)
  const active = isExactMatch
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`)

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

