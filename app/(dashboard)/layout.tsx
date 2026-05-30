import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { SiteHeaderServer } from "@/components/site-header-server"
import { SiteFooter } from "@/components/site-footer"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardUserCard } from "@/components/dashboard-user-card"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?next=/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeaderServer />
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-6">
            <DashboardUserCard />
            <DashboardSidebar />
          </aside>
          <main className="min-w-0">{children}</main>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
