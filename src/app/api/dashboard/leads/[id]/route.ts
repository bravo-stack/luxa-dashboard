import { revalidatePath } from 'next/cache';

import { getAdminUser } from '@/lib/auth/admin';
import {
  deleteSupabaseLead,
  updateSupabaseLead,
} from '@/lib/dashboard/supabase-repository';
import { type LeadStatus, leadStatuses } from '@/lib/dashboard/types';

type StatusRequest = {
  status?: unknown;
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
  const user = await getAdminUser();

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
    const updated = await updateSupabaseLead(id, { status: payload.status });

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

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getAdminUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  if (!isUuid(id)) {
    return Response.json({ error: 'Invalid lead id' }, { status: 400 });
  }

  try {
    const deleted = await deleteSupabaseLead(id);

    if (!deleted) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/leads');

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete lead', error);
    return Response.json({ error: 'The lead could not be deleted' }, { status: 500 });
  }
}
