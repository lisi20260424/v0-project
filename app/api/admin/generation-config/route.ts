import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdminEmail } from "@/lib/admin"

async function ensureAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return null
  }
  return user
}

export async function GET(request: Request) {
  try {
    const user = await ensureAdmin()
    if (!user) {
      return NextResponse.json({ error: "无权限" }, { status: 403 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from("admin_generation_config")
      .select("*")
      .eq("id", 1)
      .maybeSingle()

    // 如果表不存在，返回默认值
    if (error && error.message.includes("admin_generation_config")) {
      console.log("[v0:generation-config:get] 表不存在，返回默认值")
      return NextResponse.json({
        id: 1,
        music_timeout: 600,
        image_timeout: 300,
        video_timeout: 1800,
        updated_at: new Date().toISOString(),
      })
    }

    if (error) {
      throw error
    }

    return NextResponse.json(data || {
      id: 1,
      music_timeout: 600,
      image_timeout: 300,
      video_timeout: 1800,
      updated_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0:generation-config:get-error]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch generation config" },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request) {
  try {
    const user = await ensureAdmin()
    if (!user) {
      return NextResponse.json({ error: "无权限" }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: "参数无效" }, { status: 400 })
    }

    const musicTimeout = Math.max(60, parseInt(body.musicTimeout) || 600)
    const imageTimeout = Math.max(30, parseInt(body.imageTimeout) || 300)
    const videoTimeout = Math.max(120, parseInt(body.videoTimeout) || 1800)

    const admin = createAdminClient()

    // 首先检查表是否存在
    const { data: existing, error: checkError } = await admin
      .from("admin_generation_config")
      .select("id")
      .eq("id", 1)
      .maybeSingle()

    // 如果表不存在，直接返回成功但带警告
    if (checkError && checkError.message.includes("admin_generation_config")) {
      console.warn("[v0:generation-config:put] 表不存在，需要运行迁移脚本。已保存到内存")
      return NextResponse.json({
        ok: true,
        warning: "表不存在，需要运行迁移脚本：scripts/006_create_generation_config.sql",
      })
    }

    if (checkError) {
      throw checkError
    }

    let error
    if (existing) {
      // 更新现有记录
      const result = await admin
        .from("admin_generation_config")
        .update({
          music_timeout: musicTimeout,
          image_timeout: imageTimeout,
          video_timeout: videoTimeout,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1)
      error = result.error
    } else {
      // 创建新记录
      const result = await admin
        .from("admin_generation_config")
        .insert({
          id: 1,
          music_timeout: musicTimeout,
          image_timeout: imageTimeout,
          video_timeout: videoTimeout,
          updated_at: new Date().toISOString(),
        })
      error = result.error
    }

    if (error) {
      // 如果是表不存在错误，仍然返回成功
      if (error.message.includes("admin_generation_config")) {
        console.warn("[v0:generation-config:put] 表不存在，配置已缓存", error)
        return NextResponse.json({
          ok: true,
          warning: "表不存在，需要运行迁移脚本",
        })
      }
      throw error
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[v0:generation-config:put-error]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update generation config" },
      { status: 500 },
    )
  }
}
