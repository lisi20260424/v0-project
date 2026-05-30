import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * 服务端 Supabase 客户端，使用 service_role key 绕过 RLS。
 * 仅在服务端代码（Route Handlers / Server Components / Server Actions）中使用。
 * 严禁在客户端组件中导入。
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error("Supabase 服务端配置缺失（需要 SUPABASE_SERVICE_ROLE_KEY）")
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
