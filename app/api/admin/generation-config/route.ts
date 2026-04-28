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

export async function PUT(request: Request) {
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

  // 检查是否存在记录
  const { data: existing } = await admin
    .from("admin_generation_config")
    .select("id")
    .eq("id", 1)
    .maybeSingle()

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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
