import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdminEmail } from "@/lib/admin"

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ ok: false, message: "无权限" }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const apiKey = typeof body?.apiKey === "string" ? body.apiKey : ""
  const gatewayUrl = typeof body?.gatewayUrl === "string" ? body.gatewayUrl.trim() : ""

  if (!gatewayUrl) {
    return NextResponse.json({ ok: false, message: "请先填写网关地址" }, { status: 400 })
  }

  let target: URL
  try {
    target = new URL(gatewayUrl)
  } catch {
    return NextResponse.json({ ok: false, message: "网关地址格式无效" }, { status: 400 })
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  }
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`
  }

  const start = Date.now()
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(target.toString(), {
      method: "GET",
      headers,
      signal: controller.signal,
      cache: "no-store",
    })

    clearTimeout(timer)
    const latency = Date.now() - start

    if (res.status === 401 || res.status === 403) {
      return NextResponse.json({
        ok: false,
        message: `连接成功但鉴权失败（HTTP ${res.status}），请检查 API Key`,
        latency,
      })
    }

    if (res.status >= 500) {
      return NextResponse.json({
        ok: false,
        message: `网关服务异常（HTTP ${res.status}）`,
        latency,
      })
    }

    return NextResponse.json({
      ok: true,
      message: `网关可达（HTTP ${res.status}）`,
      latency,
    })
  } catch (err) {
    const latency = Date.now() - start
    const aborted = err instanceof Error && err.name === "AbortError"
    return NextResponse.json({
      ok: false,
      message: aborted ? "请求超时（8s）" : err instanceof Error ? err.message : "请求失败",
      latency,
    })
  }
}
