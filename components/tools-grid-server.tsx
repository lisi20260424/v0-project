import { Suspense } from "react"
import { ToolsGrid } from "@/components/tools-grid"
import { getDisplayTools } from "@/lib/display-tools"

async function ToolsGridContent() {
  try {
    const tools = await getDisplayTools()
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
