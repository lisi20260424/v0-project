import postgres from "postgres"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function runMigration() {
  const connectionString =
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.SUPABASE_DATABASE_URL

  if (!connectionString) {
    console.error("[v0] 缺少数据库连接字符串环境变量 (POSTGRES_URL / POSTGRES_URL_NON_POOLING)")
    process.exit(1)
  }

  // 通过命令行参数选择脚本编号，默认 006
  const arg = process.argv[2] ?? "006"
  const scriptsDir = path.resolve(__dirname)
  const allFiles = fs.readdirSync(scriptsDir)
  const matched = allFiles.find((f) => f.startsWith(`${arg}_`) && f.endsWith(".sql"))

  if (!matched) {
    console.error(`[v0] 未找到以 ${arg}_ 开头的 SQL 脚本`)
    process.exit(1)
  }

  const sqlPath = path.join(scriptsDir, matched)
  const sql = fs.readFileSync(sqlPath, "utf-8")

  console.log(`[v0] 准备执行: ${matched}`)

  const client = postgres(connectionString, {
    ssl: "require",
    max: 1,
    idle_timeout: 20,
    prepare: false,
  })

  try {
    // postgres.js 的 .unsafe 支持执行多语句的原始 SQL
    await client.unsafe(sql)
    console.log(`[v0] ${matched} 执行成功！`)
  } catch (err: any) {
    console.error(`[v0] 执行失败:`, err.message)
    if (err.position) console.error(`[v0] 位置: ${err.position}`)
    if (err.detail) console.error(`[v0] 详情: ${err.detail}`)
    process.exit(1)
  } finally {
    await client.end()
  }
}

runMigration()
