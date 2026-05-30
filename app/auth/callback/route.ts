import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('[v0] OAuth callback error:', error)
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(error.message || 'OAuth 认证失败')}`
    )
  }

  // 如果没有 code 参数，返回错误
  console.error('[v0] OAuth callback: no code parameter')
  return NextResponse.redirect(
    `${origin}/auth/error?error=${encodeURIComponent('缺少认证码，请重新尝试')}`
  )
}
