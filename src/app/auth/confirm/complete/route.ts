import { NextResponse } from 'next/server';

import { parseEmailConfirmation } from '@/lib/auth/email-confirmation';
import { getApplicationOrigin } from '@/lib/auth/origin';
import { isSameOriginRequest } from '@/lib/auth/same-origin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function redirectAfterPost(path: string) {
  return NextResponse.redirect(new URL(path, getApplicationOrigin()), 303);
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');

  // Some email-app browsers omit Origin on a same-site HTML form POST. The
  // one-time token remains mandatory; reject only an explicitly cross-origin
  // submission so those browsers can complete a legitimate confirmation.
  if (origin && !isSameOriginRequest(request.url, origin)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return redirectAfterPost('/?auth=expired');
  }

  const confirmation = parseEmailConfirmation(
    formData.get('token_hash'),
    formData.get('type'),
  );

  if (!confirmation) return redirectAfterPost('/?auth=expired');

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: confirmation.tokenHash,
      type: confirmation.type,
    });

    if (error) return redirectAfterPost('/?auth=expired');
  } catch {
    return redirectAfterPost('/?auth=expired');
  }

  return redirectAfterPost(`/set-password?mode=${confirmation.type}`);
}
