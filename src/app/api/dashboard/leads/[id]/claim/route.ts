import { revalidatePath } from 'next/cache';

import { isSameOriginRequest } from '@/lib/auth/same-origin';
import { recordSecurityEvent, requirePermission } from '@/lib/auth/workspace';
import { claimSupabaseLead } from '@/lib/dashboard/supabase-repository';

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isSameOriginRequest(request.url, request.headers.get('origin'))) {
    return Response.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  let user;

  try {
    user = await requirePermission('leads.claim');
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== 'sales_exec') {
    return Response.json(
      { error: 'Only sales executives can claim shared funnel leads.' },
      { status: 403 },
    );
  }

  const { id } = await context.params;

  if (!isUuid(id)) {
    return Response.json({ error: 'Invalid lead id' }, { status: 400 });
  }

  try {
    const claimed = await claimSupabaseLead(id, user.id);

    if (!claimed) {
      return Response.json(
        { error: 'This lead is no longer available to claim.' },
        { status: 409 },
      );
    }

    await recordSecurityEvent({
      action: 'lead_claimed',
      actorUserId: user.id,
      targetUserId: user.id,
      metadata: { lead_id: id },
    });
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/leads');
    revalidatePath(`/dashboard/leads/${id}`);

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Failed to claim lead', error);
    return Response.json({ error: 'The lead could not be claimed.' }, { status: 500 });
  }
}
