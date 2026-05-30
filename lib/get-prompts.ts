import { createClient } from "@/lib/supabase/server"

export type PromptItem = {
  id: string
  title: string
  content: string
  category: string | null
}

/**
 * 读取指定模型类型下、已启用的快捷提示词。按 sort_order 升序、created_at 降序排列。
 * 依赖 RLS 策略 admin_prompts_select_enabled（authenticated 用户可读 enabled=true）。
 */
export async function getPromptsByType(
  modelType: "video" | "image" | "music",
): Promise<PromptItem[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("admin_prompts")
      .select("id, title, content, category")
      .eq("model_type", modelType)
      .eq("enabled", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] 获取提示词失败:", error)
      return []
    }
    return (data ?? []) as PromptItem[]
  } catch (e) {
    console.error("[v0] 获取提示词异常:", e)
    return []
  }
}
