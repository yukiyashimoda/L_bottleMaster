import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, SESSION_VALUE } from '@/lib/auth'

const PROTECTED = [
  /^\/customers\/new/,
  /^\/customers\/[^/]+\/edit/,
  /^\/customers\/[^/]+\/visits\/new/,
  /^\/casts\/[^/]+\/edit/,
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = PROTECTED.some((p) => p.test(pathname))
  if (!isProtected) return NextResponse.next()

  const session = request.cookies.get(SESSION_COOKIE)?.value
  if (session === SESSION_VALUE) return NextResponse.next()

  const url = request.nextUrl.clone()
  url.pathname = '/login'
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next|api|favicon\\.ico).*)'],
}
