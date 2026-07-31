import { revalidatePath } from 'next/cache';

import { isSameOriginRequest } from '@/lib/auth/same-origin';
import { getWorkspaceUser } from '@/lib/auth/workspace';
import {
  hasSupabaseLeadOutcomeReason,
  updateSupabaseLead,
} from '@/lib/dashboard/supabase-repository';
import { type LeadStatus, leadStatuses } from '@/lib/dashboard/types';

type StatusRequest = {
  status?: unknown;
  outcomeReason?: unknown;
};

function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === 'string' && leadStatuses.includes(value as LeadStatus);
}

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

  const user = await getWorkspaceUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  if (!isUuid(id)) {
    return Response.json({ error: 'Invalid lead id' }, { status: 400 });
  }

  let payload: StatusRequest;

  try {
    payload = (await request.json()) as StatusRequest;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!isLeadStatus(payload.status)) {
    return Response.json({ error: 'Invalid lead status' }, { status: 400 });
  }

  try {
    const ownerUserId = user.role === 'sales_exec' ? user.id : undefined;
    const outcomeReason =
      typeof payload.outcomeReason === 'string'
        ? payload.outcomeReason.trim().slice(0, 1_000)
        : '';

    if (
      ['won', 'lost', 'spam'].includes(payload.status) &&
      outcomeReason.length < 10 &&
      !(await hasSupabaseLeadOutcomeReason(id, ownerUserId))
    ) {
      return Response.json(
        {
          error: 'Add an outcome or disqualification reason before closing this lead.',
        },
        { status: 422 },
      );
    }

    const updated = await updateSupabaseLead(
      id,
      {
        status: payload.status,
        ...(outcomeReason ? { outcomeReason } : {}),
      },
      ownerUserId,
    );

    if (!updated) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/leads');
    revalidatePath(`/dashboard/leads/${id}`);

    return Response.json({ ok: true, status: payload.status });
  } catch (error) {
    console.error('Failed to update lead status', error);
    return Response.json(
      { error: 'The lead status could not be saved' },
      { status: 500 },
    );
  }
}
