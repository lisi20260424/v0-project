import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const admin = createAdminClient()

    // 尝试查询表，如果不存在会报错
    const { data: existing, error: queryError } = await admin
      .from("admin_generation_config")
      .select("id")
      .eq("id", 1)
      .maybeSingle()

    // 如果表存在但没有数据，创建初始行
    if (!queryError && !existing) {
      const { error: insertError } = await admin
        .from("admin_generation_config")
        .insert({
          id: 1,
          music_timeout: 600,
          image_timeout: 300,
          video_timeout: 1800,
        })

      if (insertError) {
        console.error("[v0:init:insert-error]", insertError)
        return NextResponse.json({ error: insertError.message }, { status: 400 })
      }
    }

    return NextResponse.json({ success: true, message: "Generation config initialized" })
  } catch (error) {
    console.error("[v0:init:error]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
