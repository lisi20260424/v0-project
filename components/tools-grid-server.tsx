import { Suspense } from "react"
import { ToolsGrid } from "@/components/tools-grid"
import { getDisplayTools } from "@/lib/display-tools"

async function ToolsGridContent() {
  const tools = await getDisplayTools()
  return <ToolsGrid models={tools} />
}

export function ToolsGridServer() {
  return (
    <Suspense fallback={<ToolsGrid />}>
      <ToolsGridContent />
    </Suspense>
  )
}
