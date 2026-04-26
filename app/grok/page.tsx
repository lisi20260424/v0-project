import { redirect } from "next/navigation"

export default function GrokPage() {
  redirect("/video?provider=grok")
}
