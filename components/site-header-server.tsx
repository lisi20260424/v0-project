import { Suspense } from "react"
import { SiteHeader } from "@/components/site-header"
import { getDisplayTools } from "@/lib/display-tools"

async function SiteHeaderContent() {
  const tools = await getDisplayTools()
  return <SiteHeader models={tools} />
}

export function SiteHeaderServer() {
  return (
    <Suspense fallback={<SiteHeader />}>
      <SiteHeaderContent />
    </Suspense>
  )
}
