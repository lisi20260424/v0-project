import { createAdminClient } from "@/lib/supabase/admin"
import { PromptsManager, type AdminPrompt } from "@/components/admin/prompts-manager"

export const dynamic = "force-dynamic"

export default async function AdminPromptsPage() {
  const admin = createAdminClient()
  const { data } = await admin
    .from("admin_prompts")
    .select("*")
    .order("model_type", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight">提示词配置</h1>
        <p className="text-sm text-muted-foreground">
          管理按模型类型分组的快捷提示词，启用后会出现在对应类型的生成页面，方便用户一键填入。
        </p>
      </header>

      <PromptsManager initialPrompts={(data ?? []) as AdminPrompt[]} />
    </div>
  )
}
