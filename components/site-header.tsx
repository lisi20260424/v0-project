"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronDown,
  Cpu,
  CreditCard,
  Globe,
  Images,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Plug,
  Receipt,
  Settings,
  Sparkles,
  Users,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TOOLS, CATEGORY_LABEL, type ToolCategory, type Tool } from "@/lib/tools"
import { resolveIcon } from "@/lib/icon-map"
import { useMembership } from "@/components/membership-provider"
import { useUser } from "@/components/user-provider"
import { platformAPI } from "@/lib/platform-api"

export type SiteHeaderProps = {
  models?: Tool[]
}

const tierLabel: Record<string, string> = {
  monthly: "月会员",
  annual: "年会员",
  lifetime: "终身会员",
}

export function SiteHeader({ models }: SiteHeaderProps) {
  const router = useRouter()
  const tools = models || TOOLS
  const membership = useMembership()
  const { user, isAdmin } = useUser()
  const [mounted, setMounted] = React.useState(false)
  const visibleUser = mounted ? user : null
  const visibleIsAdmin = mounted && isAdmin

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const grouped = (["video", "image", "audio"] as ToolCategory[]).map((category) => ({
    category,
    label: CATEGORY_LABEL[category],
    items: tools.filter((tool) => tool.category === category),
  }))

  const navItems = [
    { href: "/gallery", label: "作品广场" },
    { href: "/pricing", label: "定价" },
    { href: "/docs", label: "API 文档" },
    { href: "/#features", label: "帮助" },
  ]

  async function handleSignOut() {
    const accessToken = localStorage.getItem("accessToken") ?? ""
    const refreshToken = localStorage.getItem("refreshToken") ?? ""
    try {
      if (accessToken) await platformAPI.logout(accessToken, refreshToken)
    } catch (error) {
      console.warn("[v0] logout request failed:", error)
    } finally {
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
      window.dispatchEvent(new Event("auth-token-changed"))
      router.push("/")
      router.refresh()
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-sm">
              <span className="text-sm font-bold">灵</span>
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent ring-2 ring-background" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight">灵境 AI</span>
              <span className="text-[10px] text-muted-foreground">多模态创作平台</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="主导航">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-sm text-muted-foreground hover:text-foreground">
                  AI 工具
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[560px] p-3">
                <div className="grid grid-cols-2 gap-4">
                  {grouped.map((group) => (
                    <div key={group.category}>
                      <DropdownMenuLabel className="px-2 py-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                        {group.label}
                      </DropdownMenuLabel>
                      {group.items.map((tool) => {
                        const Icon = resolveIcon(tool.icon)
                        return (
                          <DropdownMenuItem key={tool.id} asChild className="gap-3 rounded-md py-2">
                            <Link href={tool.href}>
                              <div className={`flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br ${tool.accent} text-foreground`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-medium">{tool.name}</span>
                                  {tool.tag ? <span className="rounded bg-primary/10 px-1 text-[9px] font-medium text-primary">{tool.tag}</span> : null}
                                </div>
                                <span className="text-[11px] text-muted-foreground">{tool.brand}</span>
                              </div>
                            </Link>
                          </DropdownMenuItem>
                        )
                      })}
                    </div>
                  ))}
                </div>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem asChild>
                  <Link href="/#tools" className="justify-center text-xs text-muted-foreground">查看全部 AI 工具</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {visibleUser ? (
            <>
              <button
                type="button"
                onClick={() => membership.open("points")}
                className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 sm:inline-flex"
                aria-label="充值点数"
              >
                <Zap className="h-3.5 w-3.5 text-accent" fill="currentColor" />
                <span className="tabular-nums">{visibleUser.points.toLocaleString()}</span>
                <span className="text-muted-foreground">点</span>
              </button>
              <Button size="sm" onClick={() => membership.open("membership")} className="hidden h-8 rounded-full bg-gradient-to-r from-primary to-accent px-3 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 sm:inline-flex">
                <CreditCard className="mr-1 h-3.5 w-3.5" />
                会员充值
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex"><Link href="/auth/login">登录</Link></Button>
              <Button size="sm" asChild className="hidden sm:inline-flex"><Link href="/auth/sign-up">免费注册</Link></Button>
            </>
          )}

          <ThemeToggle />

          {visibleUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button aria-label="用户菜单" className="relative hidden h-8 w-8 overflow-hidden rounded-full ring-1 ring-border transition hover:ring-primary/40 sm:inline-flex">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={visibleUser.avatarUrl ?? undefined} alt="用户头像" />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-xs text-primary-foreground">{visibleUser.displayName.slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {visibleUser.status && visibleUser.status !== "active" ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"><span className="text-[10px] font-bold text-white">禁</span></div>
                  ) : null}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-2">
                  <p className="truncate text-sm font-semibold">{visibleUser.displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">{visibleUser.vipTier ? tierLabel[visibleUser.vipTier] : "免费用户"} · {visibleUser.points.toLocaleString()} 点</p>
                </div>
                <DropdownMenuSeparator />
                <MenuLink href="/dashboard" icon={LayoutDashboard} label="工作台" />
                <MenuLink href="/tasks" icon={ListChecks} label="我的任务" />
                <MenuLink href="/creations" icon={Images} label="我的创作" />
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => membership.open("membership")}><CreditCard className="mr-2 h-4 w-4" />订阅与充值</DropdownMenuItem>
                <MenuLink href="/billing" icon={CreditCard} label="订阅记录" />
                <MenuLink href="/billing/records" icon={Receipt} label="账单记录" />
                <MenuLink href="/settings" icon={Settings} label="账户设置" />
                {visibleIsAdmin ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="px-2 py-1 text-[11px] uppercase tracking-wider text-muted-foreground">管理员</DropdownMenuLabel>
                    <MenuLink href="/admin-settings/providers" icon={Globe} label="供应商配置" />
                    <MenuLink href="/admin-settings/models" icon={Cpu} label="模型配置" />
                    <MenuLink href="/admin-settings/prompts" icon={Sparkles} label="提示词配置" />
                    <MenuLink href="/admin-settings/users" icon={Users} label="用户管理" />
                    <MenuLink href="/admin-settings/system-settings" icon={Plug} label="系统设置" />
                  </>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={(event) => { event.preventDefault(); void handleSignOut() }} className="text-muted-foreground"><LogOut className="mr-2 h-4 w-4" />退出登录</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="md:hidden" aria-label="打开菜单"><Menu className="h-5 w-5" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">AI 工具</DropdownMenuLabel>
              {tools.map((tool) => <DropdownMenuItem key={tool.id} asChild><Link href={tool.href}>{tool.name}</Link></DropdownMenuItem>)}
              <DropdownMenuSeparator />
              {navItems.map((item) => <DropdownMenuItem key={item.href} asChild><Link href={item.href}>{item.label}</Link></DropdownMenuItem>)}
              <DropdownMenuSeparator />
              {visibleUser ? (
                <>
                  <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">用户中心</DropdownMenuLabel>
                  <DropdownMenuItem asChild><Link href="/dashboard">工作台</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/tasks">我的任务</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/creations">我的创作</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/settings">账户设置</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={(event) => { event.preventDefault(); void handleSignOut() }} className="text-muted-foreground">退出登录</DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild><Link href="/auth/login">登录</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/auth/sign-up">免费注册</Link></DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

function MenuLink({ href, icon: Icon, label }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <DropdownMenuItem asChild>
      <Link href={href}><Icon className="mr-2 h-4 w-4" />{label}</Link>
    </DropdownMenuItem>
  )
}
