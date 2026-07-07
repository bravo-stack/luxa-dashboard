import 'server-only';

import { cache } from 'react';

import type { AuditSubmission, Lead, LeadEvent, LeadNote, LeadStatus } from './types';

export type DashboardDataset = {
  leads: Lead[];
  auditSubmissions: AuditSubmission[];
  leadEvents: LeadEvent[];
  leadNotes: LeadNote[];
  source: 'supabase';
};

type SupabaseResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

function hasSupabaseServerConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

async function getSupabaseAdminClient() {
  if (!hasSupabaseServerConfig()) {
    return null;
  }

  const { supabaseAdmin } = await import('@/lib/supabase/admin');

  return supabaseAdmin;
}

function normalizeRecordMap(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function normalizeEventMetadata(
  value: unknown,
): Record<string, string | number | boolean | null> {
  const metadata = normalizeRecordMap(value);

  return Object.fromEntries(
    Object.entries(metadata).filter(
      (entry): entry is [string, string | number | boolean | null] => {
        const value = entry[1];

        return (
          value === null ||
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean'
        );
      },
    ),
  );
}

function normalizeLead(row: Record<string, unknown>): Lead {
  return {
    id: String(row.id),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    name: String(row.name),
    email: String(row.email),
    company: String(row.company),
    website: row.website ? String(row.website) : undefined,
    status: row.status as LeadStatus,
    source: String(row.source),
    owner_user_id: row.owner_user_id ? String(row.owner_user_id) : null,
    last_contacted_at: row.last_contacted_at ? String(row.last_contacted_at) : null,
    qualification_score: Number(row.qualification_score ?? 0),
  };
}

function normalizeAuditSubmission(row: Record<string, unknown>): AuditSubmission {
  return {
    id: String(row.id),
    lead_id: String(row.lead_id),
    created_at: String(row.created_at),
    submission_type: row.submission_type === 'full_audit' ? 'full_audit' : 'quick_start',
    source: String(row.source),
    project_type: String(row.project_type),
    industry_segment: String(row.industry_segment),
    system_status: String(row.system_status),
    problems: String(row.problems),
    improve_first: String(row.improve_first),
    budget_range: String(row.budget_range),
    timeline: String(row.timeline),
    decision_stage: String(row.decision_stage),
    preferred_next_step: String(row.preferred_next_step),
    extra_context: String(row.extra_context ?? ''),
    raw_payload: normalizeRecordMap(row.raw_payload),
  };
}

function normalizeLeadEvent(row: Record<string, unknown>): LeadEvent {
  return {
    id: String(row.id),
    lead_id: row.lead_id ? String(row.lead_id) : null,
    created_at: String(row.created_at),
    event_type: String(row.event_type),
    event_name: row.event_name ? String(row.event_name) : undefined,
    source: String(row.source),
    metadata: normalizeEventMetadata(row.metadata),
  };
}

function normalizeLeadNote(row: Record<string, unknown>): LeadNote {
  return {
    id: String(row.id),
    lead_id: String(row.lead_id),
    created_at: String(row.created_at),
    created_by: String(row.created_by),
    body: String(row.body),
  };
}

function hasQueryError(...results: SupabaseResult<Record<string, unknown>>[]) {
  const failed = results.find((result) => result.error);

  if (failed?.error) {
    console.error('Supabase dashboard query failed:', failed.error.message);
    return true;
  }

  return false;
}

export const getSupabaseDashboardDataset = cache(async () => {
  const supabase = await getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const [leadsResult, submissionsResult, eventsResult, notesResult] = await Promise.all([
    supabase.from('leads').select('*').order('created_at', { ascending: false }),
    supabase
      .from('audit_submissions')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('lead_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000),
    supabase
      .from('lead_notes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500),
  ]);

  if (
    hasQueryError(
      leadsResult as SupabaseResult<Record<string, unknown>>,
      submissionsResult as SupabaseResult<Record<string, unknown>>,
      eventsResult as SupabaseResult<Record<string, unknown>>,
      notesResult as SupabaseResult<Record<string, unknown>>,
    )
  ) {
    return null;
  }

  return {
    leads: (leadsResult.data ?? []).map((row) =>
      normalizeLead(row as Record<string, unknown>),
    ),
    auditSubmissions: (submissionsResult.data ?? []).map((row) =>
      normalizeAuditSubmission(row as Record<string, unknown>),
    ),
    leadEvents: (eventsResult.data ?? []).map((row) =>
      normalizeLeadEvent(row as Record<string, unknown>),
    ),
    leadNotes: (notesResult.data ?? []).map((row) =>
      normalizeLeadNote(row as Record<string, unknown>),
    ),
    source: 'supabase',
  } satisfies DashboardDataset;
});

export async function updateSupabaseLead(
  leadId: string,
  values: Partial<Pick<Lead, 'status' | 'owner_user_id' | 'last_contacted_at'>> & {
    qualification_score?: number;
  },
) {
  const supabase = await getSupabaseAdminClient();

  if (!supabase) {
    return false;
  }

  const { error } = await supabase
    .from('leads')
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

export async function insertSupabaseLeadNote(leadId: string, body: string) {
  const supabase = await getSupabaseAdminClient();

  if (!supabase) {
    return false;
  }

  const { error } = await supabase.from('lead_notes').insert({
    lead_id: leadId,
    created_by: 'Luxa team',
    body,
  });

  if (error) {
    throw new Error(error.message);
  }

  await insertSupabaseLeadEvent(leadId, 'lead_note_added', {
    note_added: true,
  });

  return true;
}

export async function insertSupabaseLeadEvent(
  leadId: string,
  eventName: string,
  metadata: Record<string, string | number | boolean | null>,
) {
  const supabase = await getSupabaseAdminClient();

  if (!supabase) {
    return false;
  }

  const { error } = await supabase.from('lead_events').insert({
    lead_id: leadId,
    event_name: eventName,
    event_type: eventName,
    source: 'dashboard',
    metadata,
  });

  if (error) {
    throw new Error(error.message);
  }

  return true;
}
