import { Suspense } from "react"
import { SiteHeader } from "@/components/site-header"
import { createClient } from "@/lib/supabase/server"
import { getDisplayTools } from "@/lib/display-tools"

async function SiteHeaderContent() {
  try {
    const supabase = await createClient()
    const tools = await getDisplayTools(supabase as any)
    if (tools.length === 0) return <SiteHeader />
    return <SiteHeader models={tools} />
  } catch (error) {
    console.error("[v0] 加载 SiteHeader 失败:", error)
    return <SiteHeader />
  }
}

export function SiteHeaderServer() {
  return (
    <Suspense fallback={<SiteHeader />}>
      <SiteHeaderContent />
    </Suspense>
  )
}
