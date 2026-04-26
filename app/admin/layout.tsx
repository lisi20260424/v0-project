import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/supabase/require-admin"
import { createClient } from "@/lib/supabase/server"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { user } = await requireAdmin(supabase)

  if (!user) {
    redirect("/auth/login")
  }

  return <>{children}</>
}
