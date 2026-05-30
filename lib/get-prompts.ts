import { platformAPI } from "@/lib/platform-api"

export type PromptItem = {
  id: string
  title: string
  content: string
  category: string | null
}

export async function getPromptsByType(
  modelType: "video" | "image" | "music",
): Promise<PromptItem[]> {
  try {
    const res = await platformAPI.publicPrompts(modelType)
    const prompts = res.prompts ?? res.data?.prompts ?? []
    return prompts.map((p: any) => ({
      id: p.id,
      title: p.title,
      content: p.content,
      category: p.category ?? null,
    }))
  } catch (e) {
    console.error("[v0] 获取提示词失败", e)
    return []
  }
}
