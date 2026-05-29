"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { ChevronLeft, ChevronRight, Video, ImageIcon, Music2, AlertCircle, CheckCircle2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { platformAPI } from "@/lib/platform-api"

type ConsumptionRecord = {
  id: string
  type: string
  status: string
  tool_label: string
  cost: number
  created_at: string
  completed_at: string | null
  error_message: string | null
}

type ConsumptionResponse = {
  data: ConsumptionRecord[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const fetcher = async (key: string): Promise<ConsumptionResponse> => {
  const token = localStorage.getItem("accessToken") ?? ""
  if (!token) throw new Error("请先登录后再试")
  const query = key.startsWith("cons:") ? key.slice("cons:".length) : key
  return platformAPI.userConsumption(token, query)
}

const TYPE_ICONS = {
  video: { icon: Video, label: "瑙嗛", color: "text-blue-500" },
  image: { icon: ImageIcon, label: "鍥惧儚", color: "text-purple-500" },
  music: { icon: Music2, label: "闊充箰", color: "text-pink-500" },
}

const STATUS_CONFIG = {
  success: { label: "瀹屾垚", icon: CheckCircle2, color: "text-green-500", variant: "default" as const },
  running: { label: "杩愯涓?, icon: Clock, color: "text-blue-500", variant: "secondary" as const },
  failed: { label: "澶辫触", icon: AlertCircle, color: "text-red-500", variant: "destructive" as const },
  queued: { label: "鎺掗槦涓?, icon: Clock, color: "text-yellow-500", variant: "secondary" as const },
}

export function ConsumptionRecords() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [type, setType] = useState("all")
  const [status, setStatus] = useState("all")

  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    ...(type !== "all" && { type }),
    ...(status !== "all" && { status }),
  })

  const { data, isLoading, error } = useSWR<ConsumptionResponse>(
    `cons:${queryParams.toString()}`,
    fetcher,
    { keepPreviousData: true }
  )

  const handlePageChange = (newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, data?.totalPages || 1)))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="space-y-6">
      {/* 绛涢€夊櫒 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">绫诲瀷</label>
            <Select value={type} onValueChange={(v) => { setType(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">鍏ㄩ儴绫诲瀷</SelectItem>
                <SelectItem value="video">瑙嗛</SelectItem>
                <SelectItem value="image">鍥惧儚</SelectItem>
                <SelectItem value="music">闊充箰</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">鐘舵€�</label>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">鍏ㄩ儴鐘舵€�</SelectItem>
                <SelectItem value="success">瀹屾垚</SelectItem>
                <SelectItem value="running">杩愯涓?/SelectItem>
                <SelectItem value="queued">鎺掗槦涓?/SelectItem>
                <SelectItem value="failed">澶辫触</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          鍏?{data?.total || 0} 鏉¤褰?
        </div>
      </div>

      {/* 琛ㄦ牸 */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">绫诲瀷</TableHead>
              <TableHead>宸ュ叿</TableHead>
              <TableHead className="text-right">娑堣垂鐐规暟</TableHead>
              <TableHead>鐘舵€�</TableHead>
              <TableHead>鍒涘缓鏃堕棿</TableHead>
              <TableHead>瀹屾垚鏃堕棿</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && !data ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Spinner />
                    <span>鍔犺浇涓?..</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-destructive">
                  鍔犺浇澶辫触锛岃閲嶈瘯
                </TableCell>
              </TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  鏆傛棤娑堣垂璁板綍
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((record) => {
                const typeConfig = TYPE_ICONS[record.type as keyof typeof TYPE_ICONS] || {
                  icon: ImageIcon,
                  label: record.type,
                  color: "text-gray-500",
                }
                const TypeIcon = typeConfig.icon
                const statusConfig = STATUS_CONFIG[record.status as keyof typeof STATUS_CONFIG] || {
                  label: record.status,
                  icon: Clock,
                  color: "text-gray-500",
                  variant: "secondary" as const,
                }
                const StatusIcon = statusConfig.icon

                return (
                  <TableRow key={record.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TypeIcon className={`h-4 w-4 ${typeConfig.color}`} />
                        <span className="text-xs font-medium">{typeConfig.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">
                      {record.tool_label}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold tabular-nums">{record.cost}</span> 鐐?
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig.variant} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(record.created_at).toLocaleString("zh-CN", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {record.completed_at
                        ? new Date(record.completed_at).toLocaleString("zh-CN", {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
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

