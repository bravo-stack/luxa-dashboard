import 'server-only';

import { cache } from 'react';
import { randomUUID } from 'node:crypto';

import type {
  AuditSubmission,
  ConnectionStatus,
  Lead,
  LeadEvent,
  LeadNote,
  LeadOrigin,
  LeadStatus,
} from './types';

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
  icpCategory?: string;
  linkedinProfileUrl?: string;
  focusName?: string;
  focusTitle?: string;
  focusLinkedinUrl?: string;
  connectionStatus?: ConnectionStatus;
  lastOutreachDate?: string;
  nextFollowUpAction?: string;
  painPoints?: string;
  facebookUrl?: string;
  whatsapp?: string;
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
    (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
  );
}

async function getSupabaseAdminClient() {
  if (!hasSupabaseServerConfig()) {
    throw new Error(
      'Supabase CRM is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY (or the supported legacy variables).',
    );
  }

  const { supabaseAdmin } = await import('@/lib/supabase/admin');

  return supabaseAdmin;
}

const leadSubmissionSelect = [
  'id',
  'created_at',
  'updated_at',
  'status',
  'form_type',
  'origin',
  'created_by',
  'owner_user_id',
  'locale',
  'pathname',
  'full_name',
  'email',
  'company',
  'website',
  'icp_category',
  'linkedin_profile_url',
  'focus_name',
  'focus_title',
  'focus_linkedin_url',
  'connection_status',
  'last_outreach_date',
  'next_follow_up_action',
  'pain_points',
  'facebook_url',
  'whatsapp',
  'project_type',
  'industry',
  'system_status',
  'problems',
  'improve_first',
  'budget',
  'timeline',
  'decision_stage',
  'context',
  'next_step',
  'attribution',
  'internal_notes',
].join(',');

function normalizeRecordMap(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function normalizeLead(row: Record<string, unknown>): Lead {
  const attribution = normalizeRecordMap(row.attribution);
  const origin = normalizeLeadOrigin(row.origin, row.form_type);
  const marketingSource =
    origin === 'website'
      ? typeof attribution.utm_source === 'string'
        ? attribution.utm_source
        : String(row.pathname)
      : undefined;

  return {
    id: String(row.id),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    name: String(row.full_name),
    email: String(row.email),
    company: String(row.company),
    website: row.website ? String(row.website) : undefined,
    icpCategory: row.icp_category ? String(row.icp_category) : undefined,
    linkedinProfileUrl: row.linkedin_profile_url
      ? String(row.linkedin_profile_url)
      : undefined,
    focusName: row.focus_name ? String(row.focus_name) : undefined,
    focusTitle: row.focus_title ? String(row.focus_title) : undefined,
    focusLinkedinUrl: row.focus_linkedin_url ? String(row.focus_linkedin_url) : undefined,
    connectionStatus: row.connection_status
      ? (String(row.connection_status) as ConnectionStatus)
      : undefined,
    lastOutreachDate: row.last_outreach_date ? String(row.last_outreach_date) : undefined,
    nextFollowUpAction: row.next_follow_up_action
      ? String(row.next_follow_up_action)
      : undefined,
    painPoints: row.pain_points ? String(row.pain_points) : undefined,
    facebookUrl: row.facebook_url ? String(row.facebook_url) : undefined,
    whatsapp: row.whatsapp ? String(row.whatsapp) : undefined,
    status: row.status as LeadStatus,
    origin,
    marketingSource,
    created_by: row.created_by ? String(row.created_by) : undefined,
    owner_user_id: row.owner_user_id ? String(row.owner_user_id) : undefined,
    locale: row.locale === 'ar' ? 'ar' : 'en',
    pathname: String(row.pathname),
  };
}

function normalizeLeadOrigin(origin: unknown, formType: unknown): LeadOrigin {
  if (
    origin === 'website' ||
    origin === 'manual' ||
    origin === 'import' ||
    origin === 'integration'
  ) {
    return origin;
  }

  return formType === 'manual' ? 'manual' : 'website';
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
      origin: 'manual',
      idempotency_key: randomUUID(),
      locale: input.locale,
      pathname: '/dashboard/leads/new',
      full_name: input.fullName,
      email: input.email,
      company: input.company,
      website: input.website ?? null,
      icp_category: input.icpCategory ?? null,
      linkedin_profile_url: input.linkedinProfileUrl ?? null,
      focus_name: input.focusName ?? null,
      focus_title: input.focusTitle ?? null,
      focus_linkedin_url: input.focusLinkedinUrl ?? null,
      connection_status: input.connectionStatus ?? null,
      last_outreach_date: input.lastOutreachDate ?? null,
      next_follow_up_action: input.nextFollowUpAction ?? null,
      pain_points: input.painPoints ?? null,
      facebook_url: input.facebookUrl ?? null,
      whatsapp: input.whatsapp ?? null,
      project_type: input.projectType,
      industry: input.industry ?? null,
      budget: input.budget ?? null,
      timeline: input.timeline ?? null,
      context: input.context ?? null,
      next_step: input.nextStep ?? null,
      attribution: { entry_method: 'dashboard_manual' },
      created_by: createdBy,
      owner_user_id: createdBy,
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
    .select(leadSubmissionSelect)
    .order('created_at', { ascending: false });

  const queryError = getQueryError(
    submissionsResult as SupabaseResult<Record<string, unknown>>,
  );

  if (queryError) {
    throw new Error(`Supabase CRM query failed: ${queryError}`);
  }

  const rows = (submissionsResult.data ?? []) as unknown as Record<string, unknown>[];

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
  values: Partial<
    Pick<
      Lead,
      | 'status'
      | 'icpCategory'
      | 'linkedinProfileUrl'
      | 'focusName'
      | 'focusTitle'
      | 'focusLinkedinUrl'
      | 'connectionStatus'
      | 'lastOutreachDate'
      | 'nextFollowUpAction'
      | 'painPoints'
      | 'facebookUrl'
      | 'whatsapp'
    >
  >,
) {
  const supabase = await getSupabaseAdminClient();

  const databaseValues = {
    ...(values.status !== undefined ? { status: values.status } : {}),
    ...(values.icpCategory !== undefined
      ? { icp_category: values.icpCategory || null }
      : {}),
    ...(values.linkedinProfileUrl !== undefined
      ? { linkedin_profile_url: values.linkedinProfileUrl || null }
      : {}),
    ...(values.focusName !== undefined ? { focus_name: values.focusName || null } : {}),
    ...(values.focusTitle !== undefined
      ? { focus_title: values.focusTitle || null }
      : {}),
    ...(values.focusLinkedinUrl !== undefined
      ? { focus_linkedin_url: values.focusLinkedinUrl || null }
      : {}),
    ...(values.connectionStatus !== undefined
      ? { connection_status: values.connectionStatus || null }
      : {}),
    ...(values.lastOutreachDate !== undefined
      ? { last_outreach_date: values.lastOutreachDate || null }
      : {}),
    ...(values.nextFollowUpAction !== undefined
      ? { next_follow_up_action: values.nextFollowUpAction || null }
      : {}),
    ...(values.painPoints !== undefined
      ? { pain_points: values.painPoints || null }
      : {}),
    ...(values.facebookUrl !== undefined
      ? { facebook_url: values.facebookUrl || null }
      : {}),
    ...(values.whatsapp !== undefined ? { whatsapp: values.whatsapp || null } : {}),
  };

  const { data, error } = await supabase
    .from('lead_submissions')
    .update({
      ...databaseValues,
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId)
    .select('id')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
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
