import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// 防止并发令牌锁冲突的请求锁（按会话维度串行化）
const requestLocks = new Map<string, Promise<unknown>>()

async function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const previous = requestLocks.get(key) ?? Promise.resolve()
  const next = previous.then(fn, fn)
  // 失败后也要把链解开，避免污染下一次请求
  requestLocks.set(
    key,
    next.catch(() => undefined),
  )
  return next
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // 提取会话 ID 作为锁的键，防止同一会话的并发请求冲突
  const sessionId = request.cookies.get('sb-access-token')?.value || 'default'

  try {
    const redirected = await withLock<NextResponse | null>(sessionId, async () => {
      // With Fluid compute, don't put this client in a global environment
      // variable. Always create a new one on each request.
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) =>
                request.cookies.set(name, value),
              )
              supabaseResponse = NextResponse.next({
                request,
              })
              cookiesToSet.forEach(({ name, value, options }) =>
                supabaseResponse.cookies.set(name, value, options),
              )
            },
          },
        },
      )

      // IMPORTANT: If you remove getUser() and you use server-side rendering
      // with the Supabase client, your users may be randomly logged out.
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (
        request.nextUrl.pathname.startsWith('/protected') &&
        !user
      ) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        return NextResponse.redirect(url)
      }
      return null
    })

    if (redirected) return redirected
  } catch (error) {
    console.error('[v0] Middleware session update error:', error)
    // 继续处理，不中断请求
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
