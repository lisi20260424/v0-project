"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, Zap, ChevronDown, LayoutDashboard, ListChecks, Images, CreditCard, Settings, LogOut } from "lucide-react"
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
import { TOOLS, CATEGORY_LABEL, type ToolCategory } from "@/lib/tools"
import { useMembership } from "@/components/membership-provider"
import { useUser } from "@/components/user-provider"

const navItems = [
  { label: "作品广场", href: "/gallery" },
  { label: "定价", href: "/pricing" },
  { label: "API 文档", href: "/docs" },
  { label: "帮助", href: "/help" },
]

export function SiteHeader() {
  const membership = useMembership()
  const { user } = useUser()
  const tierLabel: Record<NonNullable<NonNullable<typeof user>["vipTier"]>, string> = {
    monthly: "月会员",
    annual: "年会员",
    lifetime: "终身会员",
  }
  const grouped = (["video", "image", "audio", "chat"] as ToolCategory[]).map((c) => ({
    category: c,
    label: CATEGORY_LABEL[c],
    items: TOOLS.filter((t) => t.category === c),
  }))

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
                  {grouped.map((g) => (
                    <div key={g.category}>
                      <DropdownMenuLabel className="px-2 py-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                        {g.label}
                      </DropdownMenuLabel>
                      {g.items.map((t) => {
                        const Icon = t.icon
                        return (
                          <DropdownMenuItem key={t.id} asChild className="gap-3 rounded-md py-2">
                            <Link href={t.href}>
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br ${t.accent} text-foreground`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-medium">{t.name}</span>
                                  {t.tag && (
                                    <span className="rounded bg-primary/10 px-1 text-[9px] font-medium text-primary">
                                      {t.tag}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-muted-foreground">{t.brand}</span>
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
                  <Link href="/#tools" className="justify-center text-xs text-muted-foreground">
                    查看全部 AI 工具
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <button
                type="button"
                onClick={() => membership.open("points")}
                className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 sm:inline-flex"
                aria-label="充值点数"
              >
                <Zap className="h-3.5 w-3.5 text-accent" fill="currentColor" />
                <span className="tabular-nums">{user.points.toLocaleString()}</span>
                <span className="text-muted-foreground">点</span>
              </button>
              <Button
                size="sm"
                onClick={() => membership.open("membership")}
                className="hidden h-8 rounded-full bg-gradient-to-r from-primary to-accent px-3 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 sm:inline-flex"
              >
                <CreditCard className="mr-1 h-3.5 w-3.5" />
                会员充值
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                <Link href="/auth/login">登录</Link>
              </Button>
              <Button size="sm" asChild className="hidden sm:inline-flex">
                <Link href="/auth/sign-up">免费注册</Link>
              </Button>
            </>
          )}

          <ThemeToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="用户菜单"
                  className="hidden h-8 w-8 overflow-hidden rounded-full ring-1 ring-border transition hover:ring-primary/40 sm:inline-flex"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl ?? undefined} alt="用户头像" />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-xs text-primary-foreground">
                      {user.displayName.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-2">
                  <p className="truncate text-sm font-semibold">{user.displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.vipTier ? tierLabel[user.vipTier] : "免费用户"} · {user.points.toLocaleString()} 点
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    工作台
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/tasks">
                    <ListChecks className="mr-2 h-4 w-4" />
                    我的任务
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/creations">
                    <Images className="mr-2 h-4 w-4" />
                    我的创作
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => membership.open("membership")}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  订阅与充值
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    账户设置
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="text-muted-foreground">
                  <a href="/auth/sign-out">
                    <LogOut className="mr-2 h-4 w-4" />
                    退出登录
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="打开菜单">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
                AI 工具
              </DropdownMenuLabel>
              {TOOLS.map((t) => (
                <DropdownMenuItem key={t.id} asChild>
                  <Link href={t.href}>{t.name}</Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              {navItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href}>{item.label}</Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              {user ? (
                <>
                  <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    用户中心
                  </DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">工作台</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/tasks">我的任务</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/creations">我的创作</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">账户设置</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="text-muted-foreground">
                    <a href="/auth/sign-out">退出登录</a>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/auth/login">登录</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/auth/sign-up">免费注册</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
