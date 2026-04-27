import { redirect } from "next/navigation"

export default function KlingPage() {
  redirect("/video?provider=kling")
}
