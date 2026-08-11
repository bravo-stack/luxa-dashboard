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
  const hasVerifiableOrigin = Boolean(origin && origin !== 'null');

  // Email-app webviews may omit Origin or send the standards-defined opaque
  // value "null". The one-time token remains mandatory; reject only a
  // verifiable, explicitly cross-origin submission.
  if (hasVerifiableOrigin && !isSameOriginRequest(request.url, origin)) {
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
