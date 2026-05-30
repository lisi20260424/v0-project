import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host")
  const host = forwardedHost || request.headers.get("host")
  const proto = request.headers.get("x-forwarded-proto") || "http"
  const origin = host ? `${proto}://${host}` : request.url
  const url = new URL("/", origin)

  return NextResponse.redirect(url, { status: 303 })
}

export async function GET(request: Request) {
  return POST(request)
}
