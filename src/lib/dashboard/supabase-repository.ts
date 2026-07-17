import 'server-only';

import { cache } from 'react';
import { randomUUID } from 'node:crypto';

import type { AuditSubmission, Lead, LeadEvent, LeadNote, LeadStatus } from './types';

export type DashboardDataset = {
  leads: Lead[];
  auditSubmissions: AuditSubmission[];
  leadEvents: LeadEvent[];
  leadNotes: LeadNote[];
  source: 'supabase';
};

export type ManualLeadInput = {
  fullName: string;
  email: string;
  company: string;
  website?: string;
  projectType: string;
  industry?: string;
  budget?: string;
  timeline?: string;
  context?: string;
  nextStep?: string;
  locale: 'en' | 'ar';
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
    throw new Error(
      'Supabase CRM is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    );
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

function normalizeLead(row: Record<string, unknown>): Lead {
  const attribution = normalizeRecordMap(row.attribution);

  return {
    id: String(row.id),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    name: String(row.full_name),
    email: String(row.email),
    company: String(row.company),
    website: row.website ? String(row.website) : undefined,
    status: row.status as LeadStatus,
    source:
      typeof attribution.utm_source === 'string'
        ? attribution.utm_source
        : String(row.pathname),
    locale: row.locale === 'ar' ? 'ar' : 'en',
    pathname: String(row.pathname),
  };
}

function normalizeAuditSubmission(row: Record<string, unknown>): AuditSubmission {
  const submissionType =
    row.form_type === 'platform_audit'
      ? 'platform_audit'
      : row.form_type === 'manual'
        ? 'manual'
        : 'quick_start';

  return {
    id: String(row.id),
    lead_id: String(row.id),
    created_at: String(row.created_at),
    submission_type: submissionType,
    source: String(row.pathname),
    project_type: String(row.project_type),
    industry_segment: String(row.industry ?? ''),
    system_status: String(row.system_status ?? ''),
    problems: String(row.problems ?? ''),
    improve_first: String(row.improve_first ?? ''),
    budget_range: String(row.budget ?? ''),
    timeline: String(row.timeline ?? ''),
    decision_stage: String(row.decision_stage ?? ''),
    preferred_next_step: String(row.next_step ?? ''),
    extra_context: String(row.context ?? ''),
    raw_payload: normalizeRecordMap(row.attribution),
  };
}

export async function insertSupabaseManualLead(
  input: ManualLeadInput,
  createdBy: string,
) {
  const supabase = await getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('lead_submissions')
    .insert({
      status: 'new',
      form_type: 'manual',
      idempotency_key: randomUUID(),
      locale: input.locale,
      pathname: '/dashboard/leads/new',
      full_name: input.fullName,
      email: input.email,
      company: input.company,
      website: input.website ?? null,
      project_type: input.projectType,
      industry: input.industry ?? null,
      budget: input.budget ?? null,
      timeline: input.timeline ?? null,
      context: input.context ?? null,
      next_step: input.nextStep ?? null,
      attribution: { entry_method: 'dashboard_manual' },
      created_by: createdBy,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Supabase CRM insert failed: ${error.message}`);
  }

  return String(data.id);
}

function getQueryError(...results: SupabaseResult<Record<string, unknown>>[]) {
  const failed = results.find((result) => result.error);

  if (failed?.error) {
    return failed.error.message;
  }

  return null;
}

export const getSupabaseDashboardDataset = cache(async () => {
  const supabase = await getSupabaseAdminClient();

  const submissionsResult = await supabase
    .from('lead_submissions')
    .select('*')
    .order('created_at', { ascending: false });

  const queryError = getQueryError(
    submissionsResult as SupabaseResult<Record<string, unknown>>,
  );

  if (queryError) {
    throw new Error(`Supabase CRM query failed: ${queryError}`);
  }

  const rows = (submissionsResult.data ?? []) as Record<string, unknown>[];

  return {
    leads: rows.map(normalizeLead),
    auditSubmissions: rows.map(normalizeAuditSubmission),
    leadEvents: [],
    leadNotes: rows
      .filter((row) => typeof row.internal_notes === 'string' && row.internal_notes)
      .map((row) => ({
        id: `note-${String(row.id)}`,
        lead_id: String(row.id),
        created_at: String(row.updated_at),
        created_by: 'Luxa team',
        body: String(row.internal_notes),
      })),
    source: 'supabase',
  } satisfies DashboardDataset;
});

export async function updateSupabaseLead(
  leadId: string,
  values: Partial<Pick<Lead, 'status'>>,
) {
  const supabase = await getSupabaseAdminClient();

  const { error } = await supabase
    .from('lead_submissions')
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

  const { data: existing, error: readError } = await supabase
    .from('lead_submissions')
    .select('internal_notes')
    .eq('id', leadId)
    .single();

  if (readError) {
    throw new Error(readError.message);
  }

  const current = existing.internal_notes?.trim();
  const nextNotes = current ? `${current}\n\n${body}` : body;
  const { error } = await supabase
    .from('lead_submissions')
    .update({ internal_notes: nextNotes })
    .eq('id', leadId);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}
