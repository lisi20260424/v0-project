#!/usr/bin/env node
/**
 * 种子数据脚本：向数据库插入示例供应商和模型
 * 用法: node scripts/seed-models.js
 */

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ 缺少环境变量: NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedProviders() {
  console.log("📝 开始插入供应商数据...")

  const providers = [
    {
      id: "550e8400-e29b-41d4-a716-446655440001",
      name: "openai",
      display_name: "OpenAI",
      enabled: true,
      sort_order: 1,
      config: {
        ui_by_type: {
          video: {
            display_name: "Sora 视频",
            icon: "Film",
            cost: "Pro",
            description: "OpenAI's advanced video generation model",
          },
          image: {
            display_name: "GPT-Image",
            icon: "ImageIcon",
            cost: "标准",
            description: "高质量图像生成",
          },
        },
      },
      description: "OpenAI 官方 API",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440002",
      name: "google",
      display_name: "Google",
      enabled: true,
      sort_order: 2,
      config: {
        ui_by_type: {
          video: {
            display_name: "Veo 视频",
            icon: "Film",
            cost: "4K",
            description: "Google Veo - Advanced video generation",
          },
          image: {
            display_name: "Nano Banana",
            icon: "ImageIcon",
            cost: "标准",
            description: "Google image generation",
          },
        },
      },
      description: "Google Gemini 和 VideoPoet",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440003",
      name: "suno",
      display_name: "Suno",
      enabled: true,
      sort_order: 3,
      config: {
        ui_by_type: {
          music: {
            display_name: "Suno 音乐",
            icon: "Music",
            cost: "标准",
            description: "AI 音乐生成",
          },
        },
      },
      description: "Suno v5 音乐生成 API",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440004",
      name: "stability",
      display_name: "Stability AI",
      enabled: true,
      sort_order: 4,
      config: {
        ui_by_type: {
          image: {
            display_name: "Flux 图像",
            icon: "ImageIcon",
            cost: "标准",
            description: "Flux - High quality image generation",
          },
          video: {
            display_name: "可灵视频",
            icon: "Film",
            cost: "HOT",
            description: "Kuaishou Kling video generation",
          },
        },
      },
      description: "Stability AI 和 Kuaishou",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440005",
      name: "xai",
      display_name: "xAI",
      enabled: true,
      sort_order: 5,
      config: {
        ui_by_type: {
          video: {
            display_name: "Grok 视频",
            icon: "Film",
            cost: "新",
            description: "xAI Grok video generation",
          },
        },
      },
      description: "xAI Grok 视频生成",
    },
  ]

  const { error } = await supabase.from("admin_providers").upsert(providers, { onConflict: "name" })

  if (error) {
    console.error("❌ 插入供应商失败:", error.message)
    return false
  }

  console.log("✅ 供应商数据插入成功")
  return true
}

async function seedModels() {
  console.log("📝 开始插入模型数据...")

  const models = [
    // 视频模型
    {
      id: "650e8400-e29b-41d4-a716-446655440001",
      name: "Sora 2",
      provider: "openai",
      model_type: "video",
      enabled: true,
      description: "OpenAI 最新视频生成模型，支持 4K 分辨率和高级控制",
      cost_per_use: 25,
      sort_order: 1,
      config: {},
    },
    {
      id: "650e8400-e29b-41d4-a716-446655440002",
      name: "Veo 3.1",
      provider: "google",
      model_type: "video",
      enabled: true,
      description: "Google 高质量视频生成，支持 4K 和复杂场景",
      cost_per_use: 30,
      sort_order: 1,
      config: {},
    },
    {
      id: "650e8400-e29b-41d4-a716-446655440003",
      name: "Kling 2.0",
      provider: "stability",
      model_type: "video",
      enabled: true,
      description: "可灵视频生成，支持高分辨率输出",
      cost_per_use: 20,
      sort_order: 2,
      config: {},
    },
    {
      id: "650e8400-e29b-41d4-a716-446655440004",
      name: "Grok Video",
      provider: "xai",
      model_type: "video",
      enabled: true,
      description: "xAI Grok 视频生成功能",
      cost_per_use: 15,
      sort_order: 3,
      config: {},
    },
    // 图像模型
    {
      id: "650e8400-e29b-41d4-a716-446655440005",
      name: "DALL-E 3",
      provider: "openai",
      model_type: "image",
      enabled: true,
      description: "OpenAI 高质量图像生成",
      cost_per_use: 15,
      sort_order: 1,
      config: {},
    },
    {
      id: "650e8400-e29b-41d4-a716-446655440006",
      name: "Nano Banana",
      provider: "google",
      model_type: "image",
      enabled: true,
      description: "Google 图像生成模型",
      cost_per_use: 12,
      sort_order: 2,
      config: {},
    },
    {
      id: "650e8400-e29b-41d4-a716-446655440007",
      name: "Flux Pro",
      provider: "stability",
      model_type: "image",
      enabled: true,
      description: "Stability AI Flux 图像生成",
      cost_per_use: 18,
      sort_order: 3,
      config: {},
    },
    // 音乐模型
    {
      id: "650e8400-e29b-41d4-a716-446655440008",
      name: "Suno v5",
      provider: "suno",
      model_type: "music",
      enabled: true,
      description: "Suno 最新音乐生成模型，支持歌词自定义",
      cost_per_use: 10,
      sort_order: 1,
      config: {},
    },
  ]

  try {
    // 先删除所有旧数据
    console.log("  清除旧数据...")
    await supabase.from("admin_models").delete().neq("id", "00000000-0000-0000-0000-000000000000")

    // 然后插入新数据
    const { error } = await supabase.from("admin_models").insert(models)

    if (error) {
      console.error("❌ 插入模型失败:", error.message)
      return false
    }

    console.log("✅ 模型数据插入成功")
    return true
  } catch (err) {
    console.error("❌ 模型操作失败:", err.message)
    return false
  }
}

async function main() {
  console.log("🌱 开始数据库种子化...\n")

  const providersOk = await seedProviders()
  if (!providersOk) process.exit(1)

  console.log()

  const modelsOk = await seedModels()
  if (!modelsOk) process.exit(1)

  console.log("\n✨ 种子化完成！")
}

main().catch((err) => {
  console.error("❌ 错误:", err)
  process.exit(1)
})
