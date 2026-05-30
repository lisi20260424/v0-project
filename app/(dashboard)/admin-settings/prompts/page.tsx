import { getPublicPrompts } from "@/lib/public-catalog"
import { PromptsManager, type AdminPrompt } from "@/components/admin/prompts-manager"

export const dynamic = "force-dynamic"

export default async function AdminPromptsPage() {
  const prompts = await Promise.all([getPublicPrompts("video"), getPublicPrompts("image"), getPublicPrompts("music")])
  return <div className="flex flex-col gap-6"><header><h1 className="text-2xl font-bold tracking-tight">提示词配置</h1><p className="mt-1 text-sm text-muted-foreground">当前读取 Go API 公开提示词配置。</p></header><PromptsManager initialPrompts={prompts.flat() as AdminPrompt[]} /></div>
}
