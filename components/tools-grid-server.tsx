import { Suspense } from "react"
import { ToolsGrid } from "@/components/tools-grid"
import { createClient } from "@/lib/supabase/server"
import { getDisplayTools } from "@/lib/display-tools"

async function ToolsGridContent() {
  try {
    const supabase = await createClient()
    const tools = await getDisplayTools(supabase as any)
    if (tools.length === 0) return <ToolsGrid />
    return <ToolsGrid models={tools} />
  } catch (error) {
    console.error("[v0] 加载 ToolsGrid 失败:", error)
    return <ToolsGrid />
  }
}

export function ToolsGridServer() {
  return (
    <Suspense fallback={<ToolsGrid />}>
      <ToolsGridContent />
    </Suspense>
  )
}
