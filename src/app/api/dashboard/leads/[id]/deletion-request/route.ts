import { revalidatePath } from 'next/cache';

import { isSameOriginRequest } from '@/lib/auth/same-origin';
import { recordSecurityEvent, requirePermission } from '@/lib/auth/workspace';
import { createLeadDeletionRequest } from '@/lib/dashboard/lead-deletion';

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
    user = await requirePermission('leads.request_delete');
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  if (!isUuid(id)) {
    return Response.json({ error: 'Invalid lead id' }, { status: 400 });
  }

  let reason = '';

  try {
    const payload = (await request.json()) as { reason?: unknown };
    reason = typeof payload.reason === 'string' ? payload.reason.trim() : '';
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (reason.length < 10 || reason.length > 1_000) {
    return Response.json(
      { error: 'Explain the deletion request in 10 to 1,000 characters.' },
      { status: 422 },
    );
  }

  try {
    const result = await createLeadDeletionRequest({
      leadId: id,
      requester: user,
      reason,
    });

    if (result.outcome === 'not_found') {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (result.outcome === 'forbidden') {
      return Response.json(
        { error: 'You can only request deletion for a lead assigned to you.' },
        { status: 403 },
      );
    }

    if (result.outcome === 'already_pending') {
      return Response.json(
        { error: 'A deletion request is already awaiting review.' },
        { status: 409 },
      );
    }

    await recordSecurityEvent({
      action: 'lead_deletion_requested',
      actorUserId: user.id,
      metadata: { lead_id: id, request_id: result.id },
    });
    revalidatePath('/dashboard/leads');
    revalidatePath(`/dashboard/leads/${id}`);
    revalidatePath('/dashboard/leads/deletion-requests');

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Failed to request lead deletion', error);
    return Response.json(
      { error: 'The deletion request could not be submitted.' },
      { status: 500 },
    );
  }
}
