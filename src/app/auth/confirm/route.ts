import { type NextRequest, NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';

import { createSupabaseServerClient } from '@/lib/supabase/server';

const supportedTypes = new Set<EmailOtpType>(['invite', 'recovery']);

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const type = request.nextUrl.searchParams.get('type') as EmailOtpType | null;

  if (!tokenHash || !type || !supportedTypes.has(type)) {
    return NextResponse.redirect(new URL('/?auth=expired', request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

  if (error) {
    return NextResponse.redirect(new URL('/?auth=expired', request.url));
  }

  return NextResponse.redirect(new URL(`/set-password?mode=${type}`, request.url));
}
