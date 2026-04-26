import type { ReactNode } from "react"
import { requireAdmin } from "@/lib/supabase/require-admin"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin()

  return <>{children}</>
}
