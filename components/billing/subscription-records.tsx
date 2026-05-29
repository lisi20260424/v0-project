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
import { platformAPI } from "@/lib/platform-api"

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

const fetcher = async (key: string): Promise<SubscriptionResponse> => {
  const token = localStorage.getItem("accessToken") ?? ""
  if (!token) throw new Error("请先登录后再试")
  const query = key.startsWith("subs:") ? key.slice("subs:".length) : key
  return platformAPI.listSubscriptions(token, query)
}

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "寰呮敮浠?, variant: "secondary" },
  paid: { label: "宸叉敮浠?, variant: "default" },
  canceled: { label: "宸插彇娑?, variant: "outline" },
  expired: { label: "宸茶繃鏈?, variant: "outline" },
  refunded: { label: "宸查€€娆?, variant: "destructive" },
  failed: { label: "澶辫触", variant: "destructive" },
}

const VIP_LABEL: Record<string, string> = {
  monthly: "鏈堜細鍛?,
  annual: "骞翠細鍛?,
  lifetime: "缁堣韩浼氬憳",
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
    `subs:${queryParams.toString()}`,
    fetcher,
    { keepPreviousData: true },
  )

  const handlePageChange = (newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, data?.totalPages || 1)))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const currentVipLabel = data?.currentVip.tier ? VIP_LABEL[data.currentVip.tier] : "鍏嶈垂鐢ㄦ埛"
  const vipExpiresAt = data?.currentVip.expiresAt
  const isLifetime = data?.currentVip.tier === "lifetime"

  return (
    <div className="space-y-6">
      {/* 褰撳墠浼氬憳鐘舵€佸崱鐗?*/}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <Crown className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">褰撳墠浼氬憳</span>
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight">{currentVipLabel}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {isLifetime
              ? "姘镐箙鏈夋晥"
              : vipExpiresAt
                ? `鍒版湡锛?{formatDateOnly(vipExpiresAt)}`
                : "鏆傛湭寮€閫?}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10">
              <Coins className="h-4 w-4 text-accent" />
            </div>
            <span className="text-sm text-muted-foreground">鐐规暟浣欓</span>
          </div>
          <div className="mt-3 text-2xl font-bold tabular-nums">
            {(data?.currentVip.points ?? 0).toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">鐐规暟姘镐箙鏈夋晥</div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-medium">鍗囩骇濂楅</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">璐拱浼氬憳鎴栫偣鏁板寘锛屼韩鍙楁洿澶氭潈鐩婁笌鎶樻墸</p>
          <Button asChild size="sm" className="mt-3 w-fit rounded-full">
            <Link href="/pricing">鏌ョ湅濂楅</Link>
          </Button>
        </div>
      </div>

      {/* 绛涢€夊櫒 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">绫诲瀷</label>
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
                <SelectItem value="all">鍏ㄩ儴绫诲瀷</SelectItem>
                <SelectItem value="membership">浼氬憳濂楅</SelectItem>
                <SelectItem value="points">鐐规暟濂楅</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">鐘舵€?/label>
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
                <SelectItem value="all">鍏ㄩ儴鐘舵€?/SelectItem>
                <SelectItem value="paid">宸叉敮浠?/SelectItem>
                <SelectItem value="pending">寰呮敮浠?/SelectItem>
                <SelectItem value="canceled">宸插彇娑?/SelectItem>
                <SelectItem value="expired">宸茶繃鏈?/SelectItem>
                <SelectItem value="failed">澶辫触</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          鍏?{data?.total ?? 0} 鏉¤褰?
        </div>
      </div>

      {/* 琛ㄦ牸 */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>濂楅</TableHead>
              <TableHead>绫诲瀷</TableHead>
              <TableHead className="text-right">閲戦</TableHead>
              <TableHead className="text-right">璧犻€佺偣鏁?/TableHead>
              <TableHead>鏈夋晥鏈?/TableHead>
              <TableHead>鐘舵€?/TableHead>
              <TableHead>鏀粯鏃堕棿</TableHead>
              <TableHead>鎿嶄綔</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && !data ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Spinner />
                    <span>鍔犺浇涓?..</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-destructive">
                  鍔犺浇澶辫触锛岃鍒锋柊閲嶈瘯
                </TableCell>
              </TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  鏆傛棤璁㈤槄璁板綍
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
                      ? "姘镐箙"
                      : record.vip_starts_at && record.vip_expires_at
                        ? `${formatDateOnly(record.vip_starts_at)} ~ ${formatDateOnly(record.vip_expires_at)}`
                        : "-"
                    : "姘镐箙鏈夋晥"

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
                        {record.plan_kind === "membership" ? "浼氬憳" : "鐐规暟鍖?}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-semibold tabular-nums">
                          楼 {Number(record.amount).toFixed(2)}
                        </span>
                        {record.original_amount &&
                          Number(record.original_amount) > Number(record.amount) && (
                            <span className="text-xs text-muted-foreground line-through tabular-nums">
                              楼 {Number(record.original_amount).toFixed(2)}
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
                          <Link href={`/billing/checkout?orderId=${record.id}`}>缁х画鏀粯</Link>
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

      {/* 鍒嗛〉 */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            绗?{data.page} / {data.totalPages} 椤?
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

