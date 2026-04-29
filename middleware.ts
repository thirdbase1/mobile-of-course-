import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const protocol = request.headers.get('x-forwarded-proto') || 'https'

  // Redirect http to https
  if (protocol === 'http') {
    return NextResponse.redirect(
      `https://${host}${request.nextUrl.pathname}${request.nextUrl.search}`,
      { status: 301 }
    )
  }

  // Redirect www.mozosubz.xyz to mozosubz.xyz
  if (host.startsWith('www.')) {
    const newHost = host.replace('www.', '')
    return NextResponse.redirect(
      `https://${newHost}${request.nextUrl.pathname}${request.nextUrl.search}`,
      { status: 301 }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
