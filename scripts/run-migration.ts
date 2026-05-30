import { createClient } from "@/lib/supabase/server"
import fs from "fs"
import path from "path"

async function runMigration() {
  const supabase = await createClient()
  
  // 读取 SQL 脚本
  const sqlPath = path.join(process.cwd(), "scripts/006_create_admin_providers.sql")
  const sql = fs.readFileSync(sqlPath, "utf-8")
  
  console.log("[v0] 开始执行 SQL 迁移脚本...")
  
  try {
    // 执行 SQL
    const { error } = await supabase.rpc("execute_sql", { sql_string: sql })
    
    if (error) {
      console.error("[v0] SQL 执行出错:", error)
      process.exit(1)
    }
    
    console.log("[v0] SQL 迁移脚本执行成功！")
  } catch (err) {
    console.error("[v0] 执行迁移失败:", err)
    process.exit(1)
  }
}

runMigration()
