import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const url = new URL("/auth/login", request.url)
  url.searchParams.set("error", "oauth_unavailable")
  return NextResponse.redirect(url)
}
