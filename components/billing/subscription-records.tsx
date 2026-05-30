"use client"

import * as React from "react"
import Link from "next/link"
import useSWR from "swr"
import { ChevronLeft, ChevronRight, Crown, CreditCard, Coins, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type SubscriptionRecord = {
  id: string
  plan_code: string
  plan_kind: "membership" | "points"
  plan_name: string
  amount: number
  original_amount: number | null
  bonus_points: number
  vip_tier: "monthly" | "annual" | "lifetime" | null
  vip_starts_at: string | null
  vip_expires_at: string | null
  status: string
  payment_method: string | null
  paid_at: string | null
  created_at: string
}

type SubscriptionResponse = {
  data: SubscriptionRecord[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  currentVip: {
    tier: "monthly" | "annual" | "lifetime" | null
    expiresAt: string | null
    points: number
  }
}

const fetcher = async (url: string): Promise<SubscriptionResponse> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("加载订阅记录失败")
  return res.json()
}

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "待支付", variant: "secondary" },
  paid: { label: "已支付", variant: "default" },
  canceled: { label: "已取消", variant: "outline" },
  expired: { label: "已过期", variant: "outline" },
  refunded: { label: "已退款", variant: "destructive" },
  failed: { label: "失败", variant: "destructive" },
}

const VIP_LABEL: Record<string, string> = {
  monthly: "月会员",
  annual: "年会员",
  lifetime: "终身会员",
}

function formatDate(value: string | null) {
  if (!value) return "-"
  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDateOnly(value: string | null) {
  if (!value) return "-"
  return new Date(value).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

export function SubscriptionRecords() {
  const [page, setPage] = React.useState(1)
  const [pageSize] = React.useState(20)
  const [kind, setKind] = React.useState("all")
  const [status, setStatus] = React.useState("all")

  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    ...(kind !== "all" && { kind }),
    ...(status !== "all" && { status }),
  })

  const { data, isLoading, error } = useSWR<SubscriptionResponse>(
    `/api/user/subscriptions?${queryParams.toString()}`,
    fetcher,
    { keepPreviousData: true },
  )

  const handlePageChange = (newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, data?.totalPages || 1)))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const currentVipLabel = data?.currentVip.tier ? VIP_LABEL[data.currentVip.tier] : "免费用户"
  const vipExpiresAt = data?.currentVip.expiresAt
  const isLifetime = data?.currentVip.tier === "lifetime"

  return (
    <div className="space-y-6">
      {/* 当前会员状态卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <Crown className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">当前会员</span>
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight">{currentVipLabel}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {isLifetime
              ? "永久有效"
              : vipExpiresAt
                ? `到期：${formatDateOnly(vipExpiresAt)}`
                : "暂未开通"}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10">
              <Coins className="h-4 w-4 text-accent" />
            </div>
            <span className="text-sm text-muted-foreground">点数余额</span>
          </div>
          <div className="mt-3 text-2xl font-bold tabular-nums">
            {(data?.currentVip.points ?? 0).toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">点数永久有效</div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-medium">升级套餐</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">购买会员或点数包，享受更多权益与折扣</p>
          <Button asChild size="sm" className="mt-3 w-fit rounded-full">
            <Link href="/pricing">查看套餐</Link>
          </Button>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">类型</label>
            <Select
              value={kind}
              onValueChange={(v) => {
                setKind(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="membership">会员套餐</SelectItem>
                <SelectItem value="points">点数套餐</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">状态</label>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="paid">已支付</SelectItem>
                <SelectItem value="pending">待支付</SelectItem>
                <SelectItem value="canceled">已取消</SelectItem>
                <SelectItem value="expired">已过期</SelectItem>
                <SelectItem value="failed">失败</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          共 {data?.total ?? 0} 条记录
        </div>
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>套餐</TableHead>
              <TableHead>类型</TableHead>
              <TableHead className="text-right">金额</TableHead>
              <TableHead className="text-right">赠送点数</TableHead>
              <TableHead>有效期</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>支付时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && !data ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Spinner />
                    <span>加载中...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-destructive">
                  加载失败，请刷新重试
                </TableCell>
              </TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  暂无订阅记录
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((record) => {
                const statusConfig = STATUS_CONFIG[record.status] || {
                  label: record.status,
                  variant: "outline" as const,
                }
                const validRange =
                  record.plan_kind === "membership"
                    ? record.vip_tier === "lifetime"
                      ? "永久"
                      : record.vip_starts_at && record.vip_expires_at
                        ? `${formatDateOnly(record.vip_starts_at)} ~ ${formatDateOnly(record.vip_expires_at)}`
                        : "-"
                    : "永久有效"

                return (
                  <TableRow key={record.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{record.plan_name}</span>
                        <span className="text-xs text-muted-foreground">{record.plan_code}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        {record.plan_kind === "membership" ? (
                          <Crown className="h-3 w-3" />
                        ) : (
                          <Coins className="h-3 w-3" />
                        )}
                        {record.plan_kind === "membership" ? "会员" : "点数包"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-semibold tabular-nums">
                          ¥ {Number(record.amount).toFixed(2)}
                        </span>
                        {record.original_amount &&
                          Number(record.original_amount) > Number(record.amount) && (
                            <span className="text-xs text-muted-foreground line-through tabular-nums">
                              ¥ {Number(record.original_amount).toFixed(2)}
                            </span>
                          )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {record.bonus_points > 0 ? `+${record.bonus_points.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {validRange}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(record.paid_at ?? record.created_at)}
                    </TableCell>
                    <TableCell>
                      {record.status === "pending" ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/billing/checkout?orderId=${record.id}`}>继续支付</Link>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            第 {data.page} / {data.totalPages} 页
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(5, data.totalPages) }).map((_, i) => {
              const pageNum = Math.max(1, page - 2) + i
              if (pageNum > data.totalPages) return null
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              )
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === data.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
