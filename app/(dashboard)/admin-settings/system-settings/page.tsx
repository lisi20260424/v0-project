import { redirect } from "next/navigation"

export default function SystemSettingsIndex() {
  redirect("/admin-settings/system-settings/gateway")
}
