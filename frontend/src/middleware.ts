import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Add auth routes that don't need protection
const publicRoutes = ['/auth/login', '/auth/register']

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-storage')?.value
  const isAuthRoute = publicRoutes.includes(request.nextUrl.pathname)

  // If trying to access auth routes while logged in, redirect to dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If trying to access protected routes without token, redirect to login
  if (!isAuthRoute && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return NextResponse.next()
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 