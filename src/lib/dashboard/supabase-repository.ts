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
  LeadProspectingHistory,
  LeadStatus,
} from './types';
import { leadStatuses } from './types';
import { normalizeHttpUrl } from './urls';

export type DashboardDataset = {
  leads: Lead[];
  auditSubmissions: AuditSubmission[];
  leadEvents: LeadEvent[];
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

export type LeadQueueQuery = {
  search?: string;
  status?: string;
  budget?: string;
  timeline?: string;
  origin?: string;
  date?: string;
  sort?: 'newest' | 'oldest';
  page?: number;
  pageSize?: number;
};

export type SupabaseLeadQueue = {
  leads: Lead[];
  submissions: AuditSubmission[];
  total: number;
  page: number;
  pageSize: number;
  statusCounts: Record<LeadStatus, number>;
  platformAuditCount: number;
  budgets: string[];
  timelines: string[];
};

type SupabaseResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

async function resolveOptionalQuery<T>(query: PromiseLike<T>): Promise<T | null> {
  try {
    return await query;
  } catch {
    return null;
  }
}

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
].join(',');

const leadProspectingHistorySelect = [
  'id',
  'lead_id',
  'created_at',
  'capture_type',
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
].join(',');

const leadNoteSelect = [
  'id',
  'lead_id',
  'created_at',
  'updated_at',
  'created_by',
  'body',
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
    website: normalizeHttpUrl(row.website ? String(row.website) : undefined) ?? undefined,
    icpCategory: row.icp_category ? String(row.icp_category) : undefined,
    linkedinProfileUrl:
      normalizeHttpUrl(
        row.linkedin_profile_url ? String(row.linkedin_profile_url) : undefined,
      ) ?? undefined,
    focusName: row.focus_name ? String(row.focus_name) : undefined,
    focusTitle: row.focus_title ? String(row.focus_title) : undefined,
    focusLinkedinUrl:
      normalizeHttpUrl(
        row.focus_linkedin_url ? String(row.focus_linkedin_url) : undefined,
      ) ?? undefined,
    connectionStatus: row.connection_status
      ? (String(row.connection_status) as ConnectionStatus)
      : undefined,
    lastOutreachDate: row.last_outreach_date ? String(row.last_outreach_date) : undefined,
    nextFollowUpAction: row.next_follow_up_action
      ? String(row.next_follow_up_action)
      : undefined,
    painPoints: row.pain_points ? String(row.pain_points) : undefined,
    facebookUrl:
      normalizeHttpUrl(row.facebook_url ? String(row.facebook_url) : undefined) ??
      undefined,
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

function normalizeProspectingHistory(
  row: Record<string, unknown>,
): LeadProspectingHistory {
  return {
    id: String(row.id),
    lead_id: String(row.lead_id),
    created_at: String(row.created_at),
    captureType:
      row.capture_type === 'created' || row.capture_type === 'backfilled'
        ? row.capture_type
        : 'updated',
    icpCategory: row.icp_category ? String(row.icp_category) : undefined,
    linkedinProfileUrl:
      normalizeHttpUrl(
        row.linkedin_profile_url ? String(row.linkedin_profile_url) : undefined,
      ) ?? undefined,
    focusName: row.focus_name ? String(row.focus_name) : undefined,
    focusTitle: row.focus_title ? String(row.focus_title) : undefined,
    focusLinkedinUrl:
      normalizeHttpUrl(
        row.focus_linkedin_url ? String(row.focus_linkedin_url) : undefined,
      ) ?? undefined,
    connectionStatus: row.connection_status
      ? (String(row.connection_status) as ConnectionStatus)
      : undefined,
    lastOutreachDate: row.last_outreach_date ? String(row.last_outreach_date) : undefined,
    nextFollowUpAction: row.next_follow_up_action
      ? String(row.next_follow_up_action)
      : undefined,
    painPoints: row.pain_points ? String(row.pain_points) : undefined,
    facebookUrl:
      normalizeHttpUrl(row.facebook_url ? String(row.facebook_url) : undefined) ??
      undefined,
    whatsapp: row.whatsapp ? String(row.whatsapp) : undefined,
  };
}

function normalizeLeadNote(row: Record<string, unknown>): LeadNote {
  return {
    id: String(row.id),
    lead_id: String(row.lead_id),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    created_by: row.created_by ? 'Administrator' : 'Luxa team',
    body: String(row.body),
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
    source: 'supabase',
  } satisfies DashboardDataset;
});

function sanitizeSearchTerm(value: string) {
  return value
    .replace(/[,%_()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

function sanitizeFacetTerm(value: string | undefined) {
  return value
    ?.replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, 120);
}

export async function getSupabaseLeadQueue(
  options: LeadQueueQuery = {},
): Promise<SupabaseLeadQueue> {
  const supabase = await getSupabaseAdminClient();
  const pageSize = Math.min(100, Math.max(10, Math.floor(options.pageSize ?? 20)));
  const page = Math.max(1, Math.floor(options.page ?? 1));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase
    .from('lead_submissions')
    .select(leadSubmissionSelect, { count: 'exact' });
  const search = sanitizeSearchTerm(options.search ?? '');
  const budget = sanitizeFacetTerm(options.budget);
  const timeline = sanitizeFacetTerm(options.timeline);

  if (search) {
    const pattern = `*${search}*`;
    query = query.or(
      [
        `full_name.ilike.${pattern}`,
        `email.ilike.${pattern}`,
        `company.ilike.${pattern}`,
        `website.ilike.${pattern}`,
        `focus_name.ilike.${pattern}`,
        `focus_title.ilike.${pattern}`,
        `pain_points.ilike.${pattern}`,
        `project_type.ilike.${pattern}`,
      ].join(','),
    );
  }

  if (leadStatuses.includes(options.status as LeadStatus)) {
    query = query.eq('status', options.status);
  }

  if (budget && budget !== 'all') {
    query = query.eq('budget', budget);
  }

  if (timeline && timeline !== 'all') {
    query = query.eq('timeline', timeline);
  }

  if (
    options.origin === 'website' ||
    options.origin === 'manual' ||
    options.origin === 'import' ||
    options.origin === 'integration'
  ) {
    query = query.eq('origin', options.origin);
  }

  const now = new Date();

  if (options.date === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    query = query.gte('created_at', start.toISOString());
  } else if (options.date === '7d') {
    query = query.gte(
      'created_at',
      new Date(now.getTime() - 7 * 24 * 60 * 60 * 1_000).toISOString(),
    );
  } else if (options.date === 'older') {
    query = query.lt(
      'created_at',
      new Date(now.getTime() - 7 * 24 * 60 * 60 * 1_000).toISOString(),
    );
  }

  const [pageResult, facetResult, platformAuditResult, ...statusResults] =
    await Promise.all([
      query.order('created_at', { ascending: options.sort === 'oldest' }).range(from, to),
      resolveOptionalQuery(
        supabase.from('lead_submissions').select('budget,timeline').limit(2_000),
      ),
      resolveOptionalQuery(
        supabase
          .from('lead_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('form_type', 'platform_audit'),
      ),
      ...leadStatuses.map((status) =>
        resolveOptionalQuery(
          supabase
            .from('lead_submissions')
            .select('id', { count: 'exact', head: true })
            .eq('status', status),
        ),
      ),
    ]);

  if (pageResult.error) {
    throw new Error(`Supabase lead queue query failed: ${pageResult.error.message}`);
  }

  const rows = (pageResult.data ?? []) as unknown as Record<string, unknown>[];
  const facets =
    facetResult && !facetResult.error
      ? ((facetResult.data ?? []) as Array<{
          budget: string | null;
          timeline: string | null;
        }>)
      : rows.map((row) => ({
          budget: row.budget ? String(row.budget) : null,
          timeline: row.timeline ? String(row.timeline) : null,
        }));
  const statusCounts = Object.fromEntries(
    leadStatuses.map((status, index) => {
      const result = statusResults[index];

      return [
        status,
        result && !result.error
          ? (result.count ?? 0)
          : rows.filter((row) => row.status === status).length,
      ];
    }),
  ) as Record<LeadStatus, number>;

  return {
    leads: rows.map(normalizeLead),
    submissions: rows.map(normalizeAuditSubmission),
    total: pageResult.count ?? 0,
    page,
    pageSize,
    statusCounts,
    platformAuditCount:
      platformAuditResult && !platformAuditResult.error
        ? (platformAuditResult.count ?? 0)
        : rows.filter((row) => row.form_type === 'platform_audit').length,
    budgets: Array.from(
      new Set(facets.map((item) => item.budget).filter(Boolean) as string[]),
    ).sort(),
    timelines: Array.from(
      new Set(facets.map((item) => item.timeline).filter(Boolean) as string[]),
    ).sort(),
  };
}

export async function getSupabaseProspectingHistory(
  leadId: string,
  page: number,
  pageSize: number,
) {
  const supabase = await getSupabaseAdminClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('lead_prospecting_history')
    .select(leadProspectingHistorySelect, { count: 'exact' })
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Supabase prospecting history query failed: ${error.message}`);
  }

  return {
    rows: ((data ?? []) as unknown as Record<string, unknown>[]).map(
      normalizeProspectingHistory,
    ),
    total: count ?? 0,
  };
}

export async function getSupabaseLeadNotes(leadId: string) {
  const supabase = await getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('lead_submission_notes')
    .select(leadNoteSelect)
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Supabase lead notes query failed: ${error.message}`);
  }

  return ((data ?? []) as unknown as Record<string, unknown>[]).map(normalizeLeadNote);
}

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

export async function deleteSupabaseLead(leadId: string) {
  const supabase = await getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('lead_submissions')
    .delete()
    .eq('id', leadId)
    .select('id')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export async function insertSupabaseLeadNote(
  leadId: string,
  body: string,
  createdBy: string,
) {
  const supabase = await getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('lead_submission_notes')
    .insert({ lead_id: leadId, body, created_by: createdBy })
    .select('id')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export async function updateSupabaseLeadNote(
  leadId: string,
  noteId: string,
  body: string,
) {
  const supabase = await getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('lead_submission_notes')
    .update({ body })
    .eq('id', noteId)
    .eq('lead_id', leadId)
    .select('id')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export async function deleteSupabaseLeadNote(leadId: string, noteId: string) {
  const supabase = await getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('lead_submission_notes')
    .delete()
    .eq('id', noteId)
    .eq('lead_id', leadId)
    .select('id')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}
