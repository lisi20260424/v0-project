"use client"

import { platformAuthFetch } from "@/lib/platform-session"

import * as React from "react"
import useSWR from "swr"
import {
  ChevronLeft,
  ChevronRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  Gift,
  RotateCcw,
  Coins,
  Wallet,
  Receipt,
} from "lucide-react"
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
import { cn } from "@/lib/utils"

type BillingRecord = {
  id: string
  type: "recharge" | "refund" | "bonus" | "consumption"
  direction: "in" | "out"
  amount: number | null
  points: number
  points_balance_after: number | null
  description: string
  payment_method: string | null
  related_order_id: string | null
  related_task_id: string | null
  created_at: string
}

type BillingResponse = {
  data: BillingRecord[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  summary: {
    totalRecharge: number
    totalSpentPoints: number
    totalRefund: number
  }
}

const fetcher = async (url: string): Promise<BillingResponse> => {
  const res = await platformAuthFetch(url)
  if (!res.ok) throw new Error("加载账单记录失败")
  return res.json()
}

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: typeof ArrowDownToLine; color: string }
> = {
  recharge: { label: "充值", icon: ArrowDownToLine, color: "text-emerald-500" },
  refund: { label: "退款", icon: RotateCcw, color: "text-blue-500" },
  bonus: { label: "赠送", icon: Gift, color: "text-orange-500" },
  consumption: { label: "消费", icon: ArrowUpFromLine, color: "text-rose-500" },
}

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  wechat: "微信",
  alipay: "支付宝",
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

export function BillingRecords() {
  const [page, setPage] = React.useState(1)
  const [pageSize] = React.useState(20)
  const [type, setType] = React.useState("all")
  const [direction, setDirection] = React.useState("all")

  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    ...(type !== "all" && { type }),
    ...(direction !== "all" && { direction }),
  })

  const { data, isLoading, error } = useSWR<BillingResponse>(
    `/v1/pay/billing?${queryParams.toString()}`,
    fetcher,
    { keepPreviousData: true },
  )

  const handlePageChange = (newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, data?.totalPages || 1)))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="space-y-6">
      {/* 汇总卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10">
              <Wallet className="h-4 w-4 text-emerald-500" />
            </div>
            <span className="text-sm text-muted-foreground">累计充值</span>
          </div>
          <div className="mt-3 text-2xl font-bold tabular-nums">
            ¥ {(data?.summary.totalRecharge ?? 0).toFixed(2)}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/10">
              <Coins className="h-4 w-4 text-rose-500" />
            </div>
            <span className="text-sm text-muted-foreground">累计消费点数</span>
          </div>
          <div className="mt-3 text-2xl font-bold tabular-nums">
            {(data?.summary.totalSpentPoints ?? 0).toLocaleString()}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10">
              <Receipt className="h-4 w-4 text-blue-500" />
            </div>
            <span className="text-sm text-muted-foreground">累计退款</span>
          </div>
          <div className="mt-3 text-2xl font-bold tabular-nums">
            ¥ {(data?.summary.totalRefund ?? 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* 筛选 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">类型</label>
            <Select
              value={type}
              onValueChange={(v) => {
                setType(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="recharge">充值</SelectItem>
                <SelectItem value="consumption">消费</SelectItem>
                <SelectItem value="bonus">赠送</SelectItem>
                <SelectItem value="refund">退款</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">方向</label>
            <Select
              value={direction}
              onValueChange={(v) => {
                setDirection(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="in">收入</SelectItem>
                <SelectItem value="out">支出</SelectItem>
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
              <TableHead className="w-[120px]">类型</TableHead>
              <TableHead>说明</TableHead>
              <TableHead className="text-right">金额</TableHead>
              <TableHead className="text-right">点数变动</TableHead>
              <TableHead className="text-right">余额</TableHead>
              <TableHead>支付方式</TableHead>
              <TableHead>时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && !data ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Spinner />
                    <span>加载中...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-destructive">
                  加载失败，请刷新重试
                </TableCell>
              </TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  暂无账单记录
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((record) => {
                const config = TYPE_CONFIG[record.type] || {
                  label: record.type,
                  icon: Receipt,
                  color: "text-muted-foreground",
                }
                const Icon = config.icon
                const isIn = record.direction === "in"

                return (
                  <TableRow key={record.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        <Icon className={cn("h-3 w-3", config.color)} />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[260px] truncate text-sm">
                      {record.description}
                    </TableCell>
                    <TableCell className="text-right">
                      {record.amount && Number(record.amount) > 0 ? (
                        <span
                          className={cn(
                            "font-semibold tabular-nums",
                            isIn ? "text-emerald-500" : "text-rose-500",
                          )}
                        >
                          {isIn ? "+" : "-"}¥ {Number(record.amount).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {record.points > 0 ? (
                        <span
                          className={cn(
                            "font-semibold tabular-nums",
                            isIn ? "text-emerald-500" : "text-rose-500",
                          )}
                        >
                          {isIn ? "+" : "-"}
                          {record.points.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {record.points_balance_after !== null
                        ? record.points_balance_after.toLocaleString()
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {record.payment_method
                        ? PAYMENT_METHOD_LABEL[record.payment_method] || record.payment_method
                        : "-"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(record.created_at)}
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
