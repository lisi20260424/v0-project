import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export default async function SystemSettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
