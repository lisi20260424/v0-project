"use client"

import { platformAuthFetch } from "@/lib/platform-session"

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

const fetcher = async (url: string): Promise<ConsumptionResponse> => {
  const res = await platformAuthFetch(url)
  if (!res.ok) throw new Error("加载消费记录失败")
  return res.json()
}

const TYPE_ICONS = {
  video: { icon: Video, label: "视频", color: "text-blue-500" },
  image: { icon: ImageIcon, label: "图像", color: "text-purple-500" },
  music: { icon: Music2, label: "音乐", color: "text-pink-500" },
}

const STATUS_CONFIG = {
  success: { label: "完成", icon: CheckCircle2, color: "text-green-500", variant: "default" as const },
  running: { label: "运行中", icon: Clock, color: "text-blue-500", variant: "secondary" as const },
  failed: { label: "失败", icon: AlertCircle, color: "text-red-500", variant: "destructive" as const },
  queued: { label: "排队中", icon: Clock, color: "text-yellow-500", variant: "secondary" as const },
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
    `/v1/user/consumption?${queryParams.toString()}`,
    fetcher,
    { keepPreviousData: true }
  )

  const handlePageChange = (newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, data?.totalPages || 1)))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="space-y-6">
      {/* 筛选器 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">类型</label>
            <Select value={type} onValueChange={(v) => { setType(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="video">视频</SelectItem>
                <SelectItem value="image">图像</SelectItem>
                <SelectItem value="music">音乐</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">状态</label>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="success">完成</SelectItem>
                <SelectItem value="running">运行中</SelectItem>
                <SelectItem value="queued">排队中</SelectItem>
                <SelectItem value="failed">失败</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          共 {data?.total || 0} 条记录
        </div>
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">类型</TableHead>
              <TableHead>工具</TableHead>
              <TableHead className="text-right">消费点数</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead>完成时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && !data ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Spinner />
                    <span>加载中...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-destructive">
                  加载失败，请重试
                </TableCell>
              </TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  暂无消费记录
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
                      <span className="font-semibold tabular-nums">{record.cost}</span> 点
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
