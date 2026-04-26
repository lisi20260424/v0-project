import { redirect } from "next/navigation"

export default function SoraPage() {
  redirect("/video?provider=sora")
}
