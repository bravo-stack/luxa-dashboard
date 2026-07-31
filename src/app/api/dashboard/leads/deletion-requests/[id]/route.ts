import { revalidatePath } from 'next/cache';

import { isSameOriginRequest } from '@/lib/auth/same-origin';
import { recordSecurityEvent, requirePermission } from '@/lib/auth/workspace';
import { reviewLeadDeletionRequest } from '@/lib/dashboard/lead-deletion';

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isSameOriginRequest(request.url, request.headers.get('origin'))) {
    return Response.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  let user;

  try {
    user = await requirePermission('leads.approve_delete');
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  if (!isUuid(id)) {
    return Response.json({ error: 'Invalid request id' }, { status: 400 });
  }

  let decision: 'approved' | 'rejected' | null = null;
  let note = '';

  try {
    const payload = (await request.json()) as {
      decision?: unknown;
      note?: unknown;
    };
    decision =
      payload.decision === 'approved' || payload.decision === 'rejected'
        ? payload.decision
        : null;
    note = typeof payload.note === 'string' ? payload.note.trim().slice(0, 1_000) : '';
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!decision) {
    return Response.json({ error: 'Select approve or reject.' }, { status: 422 });
  }

  if (decision === 'rejected' && note.length < 5) {
    return Response.json(
      { error: 'Add a short note explaining why the request was rejected.' },
      { status: 422 },
    );
  }

  try {
    const reviewed = await reviewLeadDeletionRequest({
      requestId: id,
      reviewer: user,
      decision,
      note,
    });

    if (!reviewed) {
      return Response.json(
        { error: 'This request has already been reviewed or its lead no longer exists.' },
        { status: 409 },
      );
    }

    await recordSecurityEvent({
      action:
        decision === 'approved' ? 'lead_deletion_approved' : 'lead_deletion_rejected',
      actorUserId: user.id,
      metadata: { request_id: id },
    });
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/leads');
    revalidatePath('/dashboard/leads/deletion-requests');

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Failed to review lead deletion request', error);
    return Response.json(
      { error: 'The deletion request could not be reviewed.' },
      { status: 500 },
    );
  }
}
