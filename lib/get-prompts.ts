import { getPublicPrompts, type CatalogModelType } from "@/lib/public-catalog"

export type PromptItem = {
  id: string
  title: string
  content: string
  category: string | null
}

export async function getPromptsByType(modelType: CatalogModelType): Promise<PromptItem[]> {
  const prompts = await getPublicPrompts(modelType)
  return prompts.map((p) => ({
    id: p.id,
    title: p.title,
    content: p.content,
    category: p.category ?? null,
  }))
}
