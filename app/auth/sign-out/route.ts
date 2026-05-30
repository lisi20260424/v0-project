import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const url = new URL("/", request.url)
  return NextResponse.redirect(url, { status: 303 })
}

export async function GET(request: Request) {
  return POST(request)
}
