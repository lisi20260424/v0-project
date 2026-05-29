"use client"

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
import { platformAPI } from "@/lib/platform-api"

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

const fetcher = async (key: string): Promise<BillingResponse> => {
  const token = localStorage.getItem("accessToken") ?? ""
  if (!token) throw new Error("请先登录后再试")
  const query = key.startsWith("billing:") ? key.slice("billing:".length) : key
  return platformAPI.listBilling(token, query)
}

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: typeof ArrowDownToLine; color: string }
> = {
  recharge: { label: "鍏呭€?, icon: ArrowDownToLine, color: "text-emerald-500" },
  refund: { label: "閫€娆?, icon: RotateCcw, color: "text-blue-500" },
  bonus: { label: "璧犻€?, icon: Gift, color: "text-orange-500" },
  consumption: { label: "娑堣垂", icon: ArrowUpFromLine, color: "text-rose-500" },
}

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  wechat: "寰俊",
  alipay: "鏀粯瀹?,
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
    `billing:${queryParams.toString()}`,
    fetcher,
    { keepPreviousData: true },
  )

  const handlePageChange = (newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, data?.totalPages || 1)))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="space-y-6">
      {/* 姹囨€诲崱鐗?*/}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10">
              <Wallet className="h-4 w-4 text-emerald-500" />
            </div>
            <span className="text-sm text-muted-foreground">绱鍏呭€?/span>
          </div>
          <div className="mt-3 text-2xl font-bold tabular-nums">
            楼 {(data?.summary.totalRecharge ?? 0).toFixed(2)}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/10">
              <Coins className="h-4 w-4 text-rose-500" />
            </div>
            <span className="text-sm text-muted-foreground">绱娑堣垂鐐规暟</span>
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
            <span className="text-sm text-muted-foreground">绱閫€娆?/span>
          </div>
          <div className="mt-3 text-2xl font-bold tabular-nums">
            楼 {(data?.summary.totalRefund ?? 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* 绛涢€?*/}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">绫诲瀷</label>
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
                <SelectItem value="all">鍏ㄩ儴绫诲瀷</SelectItem>
                <SelectItem value="recharge">鍏呭€?/SelectItem>
                <SelectItem value="consumption">娑堣垂</SelectItem>
                <SelectItem value="bonus">璧犻€?/SelectItem>
                <SelectItem value="refund">閫€娆?/SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">鏂瑰悜</label>
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
                <SelectItem value="all">鍏ㄩ儴</SelectItem>
                <SelectItem value="in">鏀跺叆</SelectItem>
                <SelectItem value="out">鏀嚭</SelectItem>
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
              <TableHead className="w-[120px]">绫诲瀷</TableHead>
              <TableHead>璇存槑</TableHead>
              <TableHead className="text-right">閲戦</TableHead>
              <TableHead className="text-right">鐐规暟鍙樺姩</TableHead>
              <TableHead className="text-right">浣欓</TableHead>
              <TableHead>鏀粯鏂瑰紡</TableHead>
              <TableHead>鏃堕棿</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && !data ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Spinner />
                    <span>鍔犺浇涓?..</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-destructive">
                  鍔犺浇澶辫触锛岃鍒锋柊閲嶈瘯
                </TableCell>
              </TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  鏆傛棤璐﹀崟璁板綍
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
                          {isIn ? "+" : "-"}楼 {Number(record.amount).toFixed(2)}
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

