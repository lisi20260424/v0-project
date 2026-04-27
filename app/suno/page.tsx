import { redirect } from "next/navigation"

export default function SunoPage() {
  redirect("/music?provider=suno")
}
