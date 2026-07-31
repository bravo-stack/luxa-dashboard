import 'server-only';

import type { WorkspaceUser } from '@/lib/auth/types';
import { isMissingWorkspaceTable } from '@/lib/auth/workspace';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

import type { LeadDeletionRequest, LeadDeletionRequestStatus } from './types';

const deletionRequestSelect =
  'id,lead_id,lead_name,lead_email,lead_company,requested_at,requested_by,requested_by_name,reason,status,reviewed_at,reviewed_by_name,review_note';

function normalizeDeletionRequest(row: Record<string, unknown>): LeadDeletionRequest {
  return {
    id: String(row.id),
    leadId: row.lead_id ? String(row.lead_id) : undefined,
    leadName: String(row.lead_name),
    leadEmail: String(row.lead_email),
    leadCompany: String(row.lead_company),
    requestedAt: String(row.requested_at),
    requestedBy: row.requested_by ? String(row.requested_by) : undefined,
    requestedByName: String(row.requested_by_name),
    reason: String(row.reason),
    status: row.status as LeadDeletionRequestStatus,
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : undefined,
    reviewedByName: row.reviewed_by_name ? String(row.reviewed_by_name) : undefined,
    reviewNote: row.review_note ? String(row.review_note) : undefined,
  };
}

export async function getLeadDeletionRequestForLead(leadId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('lead_deletion_requests')
    .select(deletionRequestSelect)
    .eq('lead_id', leadId)
    .order('requested_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingWorkspaceTable(error)) return null;
    throw new Error(`Deletion request query failed: ${error.message}`);
  }

  return data
    ? normalizeDeletionRequest(data as unknown as Record<string, unknown>)
    : null;
}

export async function getLeadDeletionRequestOverview(
  status: LeadDeletionRequestStatus | 'all' = 'pending',
) {
  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from('lead_deletion_requests')
    .select(deletionRequestSelect, { count: 'exact' })
    .order('requested_at', { ascending: false })
    .limit(100);

  if (status !== 'all') query = query.eq('status', status);

  const [listResult, ...countResults] = await Promise.all([
    query,
    ...(['pending', 'approved', 'rejected'] as const).map((requestStatus) =>
      supabase
        .from('lead_deletion_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', requestStatus),
    ),
  ]);

  if (listResult.error) {
    if (isMissingWorkspaceTable(listResult.error)) {
      return {
        items: [],
        pendingCount: 0,
        counts: { pending: 0, approved: 0, rejected: 0, all: 0 },
        dataReady: false,
      };
    }

    throw new Error(`Deletion request query failed: ${listResult.error.message}`);
  }

  const metricError = countResults.find((result) => result.error)?.error;

  if (metricError) {
    throw new Error(`Deletion request metric query failed: ${metricError.message}`);
  }

  const pendingCount = countResults[0]?.count ?? 0;
  const approvedCount = countResults[1]?.count ?? 0;
  const rejectedCount = countResults[2]?.count ?? 0;

  return {
    items: ((listResult.data ?? []) as unknown as Record<string, unknown>[]).map(
      normalizeDeletionRequest,
    ),
    pendingCount,
    counts: {
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      all: pendingCount + approvedCount + rejectedCount,
    },
    dataReady: true,
  };
}

export async function createLeadDeletionRequest(input: {
  leadId: string;
  requester: WorkspaceUser;
  reason: string;
}) {
  const supabase = getSupabaseAdminClient();
  const { data: lead, error: leadError } = await supabase
    .from('lead_submissions')
    .select('id,full_name,email,company,owner_user_id')
    .eq('id', input.leadId)
    .maybeSingle();

  if (leadError) throw new Error(leadError.message);
  if (!lead) return { outcome: 'not_found' as const };
  if (
    input.requester.role !== 'admin' &&
    String(lead.owner_user_id ?? '') !== input.requester.id
  ) {
    return { outcome: 'forbidden' as const };
  }

  const { data, error } = await supabase
    .from('lead_deletion_requests')
    .insert({
      lead_id: input.leadId,
      lead_name: String(lead.full_name),
      lead_email: String(lead.email),
      lead_company: String(lead.company),
      requested_by: input.requester.id,
      requested_by_name: input.requester.displayName,
      requested_by_email: input.requester.email,
      reason: input.reason,
    })
    .select('id')
    .single();

  if (error?.code === '23505') return { outcome: 'already_pending' as const };
  if (error) throw new Error(error.message);
  return { outcome: 'created' as const, id: String(data.id) };
}

export async function reviewLeadDeletionRequest(input: {
  requestId: string;
  reviewer: WorkspaceUser;
  decision: 'approved' | 'rejected';
  note?: string;
}) {
  const supabase = getSupabaseAdminClient();

  if (input.decision === 'approved') {
    const { data, error } = await supabase.rpc('approve_lead_deletion_request', {
      p_request_id: input.requestId,
      p_reviewer_id: input.reviewer.id,
      p_reviewer_name: input.reviewer.displayName,
      p_note: input.note || null,
    });

    if (error) throw new Error(error.message);
    return Boolean(data);
  }

  const { data, error } = await supabase
    .from('lead_deletion_requests')
    .update({
      status: 'rejected',
      reviewed_by: input.reviewer.id,
      reviewed_by_name: input.reviewer.displayName,
      reviewed_at: new Date().toISOString(),
      review_note: input.note || null,
    })
    .eq('id', input.requestId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Boolean(data);
}
