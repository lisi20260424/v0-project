import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default function OrdersRedirectPage() {
  // 旧路径，重定向到新的账单记录页
  redirect("/billing/records")
}
