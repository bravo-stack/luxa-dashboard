import { type NextRequest, NextResponse } from 'next/server';

import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth/session';

export function proxy(request: NextRequest) {
  const isAuthenticated = verifySessionToken(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
  );
  const { pathname } = request.nextUrl;

  const isProtectedDashboardPath =
    pathname.startsWith('/dashboard') || pathname.startsWith('/api/dashboard');

  if (isProtectedDashboardPath && !isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname === '/' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/api/dashboard/:path*'],
};
