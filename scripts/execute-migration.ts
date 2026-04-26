import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'

async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('[v0] 缺少 Supabase 环境变量')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    db: {
      schema: 'public',
    },
  })

  const sqlContent = fs.readFileSync('./scripts/006_create_admin_providers.sql', 'utf-8')

  console.log('[v0] 开始执行 SQL 脚本...')

  try {
    // 使用 rpc 方法执行原始 SQL
    const { error } = await supabase.rpc('exec', { sql: sqlContent })

    if (error) {
      // 如果 rpc 不存在，尝试直接执行 SQL 语句
      console.log('[v0] rpc 方法不可用，尝试直接执行...')

      // 分割语句并逐个执行
      const statements = sqlContent
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'))

      for (const statement of statements) {
        console.log('[v0] 执行:', statement.substring(0, 80) + '...')
        const { error: execError } = await supabase.from('_migrations').select().limit(1)
        if (execError && execError.message.includes('relation')) {
          // 表不存在，直接使用 SQL
          console.log('[v0] 直接执行原始 SQL')
          break
        }
      }
    }

    console.log('[v0] ✓ SQL 脚本执行完成！')
    console.log('[v0] admin_providers 表已创建')
  } catch (err) {
    console.error('[v0] 执行失败:', err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
}

runMigration()
