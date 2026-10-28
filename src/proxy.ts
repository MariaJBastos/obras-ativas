import { NextResponse, type NextRequest } from 'next/server'
import { AUTH_COOKIE, isValidToken } from '@/lib/auth'

export async function proxy(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname.startsWith('/login')
  const authenticated = await isValidToken(request.cookies.get(AUTH_COOKIE)?.value)

  if (!authenticated && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (authenticated && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
