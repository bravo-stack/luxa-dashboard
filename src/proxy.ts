import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

import { normalizeSupabaseProjectUrl } from '@/lib/supabase/url';

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase Auth environment variables are not configured');
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(normalizeSupabaseProjectUrl(supabaseUrl), anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
  const { data } = await supabase.auth.getClaims();
  const isAdmin = data?.claims.app_metadata?.role === 'admin';
  const { pathname } = request.nextUrl;

  const isProtectedDashboardPath =
    pathname.startsWith('/dashboard') || pathname.startsWith('/api/dashboard');

  if (isProtectedDashboardPath && !isAdmin) {
    // Server Actions authorize themselves. Redirecting their POST requests returns
    // HTML where React expects an action response and produces a transport error.
    if (request.headers.has('next-action')) {
      return response;
    }

    if (pathname.startsWith('/api/dashboard')) {
      const unauthorizedResponse = NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
      response.cookies
        .getAll()
        .forEach((cookie) => unauthorizedResponse.cookies.set(cookie));
      return unauthorizedResponse;
    }

    const redirectResponse = NextResponse.redirect(new URL('/', request.url));
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  if (pathname === '/' && isAdmin) {
    const redirectResponse = NextResponse.redirect(new URL('/dashboard', request.url));
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/api/dashboard/:path*'],
};
