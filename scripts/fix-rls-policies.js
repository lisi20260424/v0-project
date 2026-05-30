#!/usr/bin/env node
/**
 * 修复 RLS 策略脚本
 * 用法: node scripts/fix-rls-policies.js
 */

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ 缺少环境变量: NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixRLSPolicies() {
  console.log("🔧 正在修复 RLS 策略...\n")

  try {
    // 1. 删除旧的 admin_models_select_enabled 策略
    console.log("1️⃣  删除旧的 admin_models_select_enabled 策略...")
    const { error: dropError } = await supabase.rpc("drop_policy_if_exists", {
      table_name: "admin_models",
      policy_name: "admin_models_select_enabled",
    })

    // 注意：Supabase 的 rpc 可能不支持直接的 SQL 执行，我们改用直接 SQL
    // 实际上我们需要使用 sql 方法，但这不在标准 JS 客户端中
    // 所以我们改为手动通过 upsert 来验证策略是否正常

    // 2. 测试 admin_models 表的匿名访问
    console.log("2️⃣  测试 admin_models 表的匿名访问...")

    const anonSupabase = createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    )

    const { data: models, error: modelsError } = await anonSupabase
      .from("admin_models")
      .select("id, name, provider, enabled")
      .eq("enabled", true)
      .limit(1)

    if (modelsError) {
      console.log("   ❌ 错误:", modelsError.message)
      console.log("   💡 提示: 需要在 Supabase 控制面板中手动修复 RLS 策略")
      console.log("\n   请执行以下步骤:")
      console.log("   1. 进入 Supabase 控制面板")
      console.log("   2. 选择 SQL 编辑器")
      console.log("   3. 执行 scripts/008_fix_rls_policies.sql 中的 SQL")
      return false
    }

    console.log("   ✅ 成功! 返回", models?.length ?? 0, "条记录")

    // 3. 测试 admin_providers 表的匿名访问
    console.log("3️⃣  测试 admin_providers 表的匿名访问...")

    const { data: providers, error: providersError } = await anonSupabase
      .from("admin_providers")
      .select("id, name, display_name, enabled")
      .eq("enabled", true)
      .limit(1)

    if (providersError) {
      console.log("   ❌ 错误:", providersError.message)
      return false
    }

    console.log("   ✅ 成功! 返回", providers?.length ?? 0, "条记录")

    console.log("\n✨ RLS 策略验证完成!")
    console.log("   如果上述测试都成功，说明 RLS 策略正常")
    console.log("   如果任何测试失败，请在 Supabase 控制面板手动执行 SQL 脚本\n")

    return true
  } catch (error) {
    console.error("❌ 操作失败:", error.message)
    return false
  }
}

fixRLSPolicies().then((success) => {
  process.exit(success ? 0 : 1)
})
