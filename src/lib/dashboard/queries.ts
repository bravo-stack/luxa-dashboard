import { getUmamiAnalytics } from '@/lib/analytics/umami';

import { dashboardDateRanges, defaultDashboardDateRange } from './config';
import {
  type DashboardDataset,
  getSupabaseDashboardDataset,
  getSupabaseProspectingHistory,
} from './supabase-repository';
import type {
  AuditSubmission,
  DashboardOverview,
  DateRangeKey,
  Lead,
  LeadDetail,
  LeadEvent,
  LeadListItem,
  LeadNote,
  LeadStatus,
  MetricSummary,
  PipelineStageSummary,
} from './types';
import { leadStatuses } from './types';
import {
  getIcpCategoryLabel,
  getLeadPriority,
  isAwaitingReply,
  isContactedWithoutNextStep,
  isQualifiedNotScheduled,
  isStaleLead,
  statusLabels,
} from './utils';

const pipelineIntentByStatus = new Map<LeadStatus, PipelineStageSummary['intent']>([
  ['new', 'primary'],
  ['contacted', 'neutral'],
  ['qualified', 'warm'],
  ['won', 'teal'],
  ['lost', 'destructive'],
  ['spam', 'neutral'],
]);

function getDateRange(key: DateRangeKey = '7d') {
  return (
    dashboardDateRanges.find((range) => range.key === key) ?? defaultDashboardDateRange
  );
}

async function getDashboardDataset(): Promise<DashboardDataset> {
  return getSupabaseDashboardDataset();
}

function sortNewest<T extends { created_at: string }>(items: T[]) {
  return items
    .slice()
    .sort(
      (first, second) =>
        new Date(second.created_at).getTime() - new Date(first.created_at).getTime(),
    );
}

function getSubmissionsForLead(leadId: string, submissions: AuditSubmission[]) {
  return sortNewest(submissions.filter((submission) => submission.lead_id === leadId));
}

function getEventsForLead(leadId: string, events: LeadEvent[]) {
  return sortNewest(events.filter((event) => event.lead_id === leadId));
}

function getNotesForLead(leadId: string, notes: LeadNote[]) {
  return sortNewest(notes.filter((note) => note.lead_id === leadId));
}

function getLiveDashboardMetrics(
  liveLeads: Lead[],
  submissions: AuditSubmission[],
  events: LeadEvent[],
): MetricSummary[] {
  const openLeads = liveLeads.filter(
    (lead) => lead.status !== 'lost' && lead.status !== 'won' && lead.status !== 'spam',
  );
  const fullAuditSubmissions = submissions.filter(
    (submission) => submission.submission_type === 'platform_audit',
  );

  return [
    {
      key: 'active_leads',
      label: 'Active leads',
      value: openLeads.length,
      trend: 'Live',
      trendDirection: 'flat',
      note: 'Excludes won, lost, and spam',
    },
    {
      key: 'qualified_leads',
      label: 'Qualified leads',
      value: liveLeads.filter((lead) => lead.status === 'qualified').length,
      trend: 'Live',
      trendDirection: 'flat',
      note: 'Above the fit threshold',
    },
    {
      key: 'contacted_leads',
      label: 'Contacted leads',
      value: liveLeads.filter((lead) => lead.status === 'contacted').length,
      trend: 'Live',
      trendDirection: 'flat',
      note: 'Discovery calls booked',
    },
    {
      key: 'awaiting_reply',
      label: 'New submissions',
      value: liveLeads.filter((lead) => lead.status === 'new').length,
      trend: 'Live',
      trendDirection: 'flat',
      note: 'New or qualified without contact',
    },
    {
      key: 'platform_audit_submissions',
      label: 'Platform audits',
      value: fullAuditSubmissions.length,
      trend: 'Live',
      trendDirection: 'flat',
      note: 'High intent audit depth',
    },
    {
      key: 'spam_submissions',
      label: 'Spam',
      value: liveLeads.filter((lead) => lead.status === 'spam').length,
      trend: 'Live',
      trendDirection: 'flat',
      note: 'Suppressed submissions',
    },
  ];
}

function getLivePipelineStages(liveLeads: Lead[]): PipelineStageSummary[] {
  return leadStatuses.map((status: LeadStatus) => {
    const count = liveLeads.filter((lead) => lead.status === status).length;

    return {
      status,
      label: statusLabels[status],
      count,
      value: `${count} leads`,
      intent: pipelineIntentByStatus.get(status) ?? 'neutral',
    };
  });
}

export async function getDashboardOverview(
  dateRange: DateRangeKey = '7d',
): Promise<DashboardOverview> {
  const dataset = await getDashboardDataset();
  const analyticsOverview = await getAnalyticsOverview(dateRange);
  const staleLeads = dataset.leads.filter(isStaleLead);
  const qualifiedNotScheduled = dataset.leads.filter(isQualifiedNotScheduled);
  const contactedWithoutNextStep = dataset.leads.filter(isContactedWithoutNextStep);
  const platformAuditsAwaitingReview = dataset.auditSubmissions.filter(
    (submission) =>
      submission.submission_type === 'platform_audit' &&
      dataset.leads.some(
        (lead) => lead.id === submission.lead_id && lead.status === 'new',
      ),
  );
  const recentSubmissions = dataset.auditSubmissions
    .filter((submission) => dataset.leads.some((lead) => lead.id === submission.lead_id))
    .sort((first, second) => {
      const typeWeight =
        Number(second.submission_type === 'platform_audit') -
        Number(first.submission_type === 'platform_audit');

      if (typeWeight !== 0) {
        return typeWeight;
      }

      return new Date(second.created_at).getTime() - new Date(first.created_at).getTime();
    })
    .slice(0, 10)
    .map((submission) => {
      const lead = dataset.leads.find((item) => item.id === submission.lead_id);

      return {
        lead: lead as Lead,
        submission,
      };
    });

  return {
    dateRange: getDateRange(dateRange),
    metrics: getLiveDashboardMetrics(
      dataset.leads,
      dataset.auditSubmissions,
      dataset.leadEvents,
    ),
    pipeline: getLivePipelineStages(dataset.leads),
    funnel: analyticsOverview.funnel,
    recentSubmissions,
    needsAttention: [
      {
        id: 'stale-leads',
        label: 'Contact overdue',
        count: staleLeads.length,
        description: 'Leads older than 48 hours with no contact',
        priority: 'contact_overdue',
        leadIds: staleLeads.map((lead) => lead.id),
      },
      {
        id: 'qualified-follow-up',
        label: 'Qualified for follow-up',
        count: qualifiedNotScheduled.length,
        description: 'Qualified submissions waiting for the next sales action',
        priority: 'high_fit',
        leadIds: qualifiedNotScheduled.map((lead) => lead.id),
      },
      {
        id: 'contacted-no-next-step',
        label: 'Contacted with no next step',
        count: contactedWithoutNextStep.length,
        description: 'Contacted leads that need a controlled follow-up path',
        priority: 'standard',
        leadIds: contactedWithoutNextStep.map((lead) => lead.id),
      },
      {
        id: 'platform-audit-review',
        label: 'Platform audits to review',
        count: platformAuditsAwaitingReview.length,
        description: 'Detailed new submissions awaiting qualification',
        priority: 'high_fit',
        leadIds: platformAuditsAwaitingReview.map((submission) => submission.lead_id),
      },
    ],
    topRoutes: analyticsOverview.topLandingPages,
    topCtaSources: analyticsOverview.ctaClicksBySource,
    topUtmCampaigns: analyticsOverview.utmCampaignPerformance,
    topReferrers: analyticsOverview.topReferrers,
    deviceCategories: analyticsOverview.deviceCategories ?? [],
    leadQuality: [
      {
        label: 'High-fit lead',
        value: dataset.leads.filter((lead) => lead.status === 'qualified').length,
        context: 'Marked qualified in the CRM',
        priority: 'high_fit',
      },
      {
        label: 'Awaiting reply',
        value: dataset.leads.filter(isAwaitingReply).length,
        context: 'New or qualified with no contact',
        priority: 'contact_overdue',
      },
      {
        label: 'Ready for proposal',
        value: dataset.leads.filter((lead) => lead.status === 'won').length,
        context: 'Converted to won',
        priority: 'review_next',
      },
    ],
  };
}

export async function getLeads(): Promise<LeadListItem[]> {
  const dataset = await getDashboardDataset();

  return dataset.leads.map((lead) => ({
    ...lead,
    submissions: getSubmissionsForLead(lead.id, dataset.auditSubmissions),
    priority: getLeadPriority(lead),
  }));
}

export async function getLeadDetail(
  id: string,
  prospectingHistoryPage = 1,
): Promise<LeadDetail | null> {
  const dataset = await getDashboardDataset();
  const lead = dataset.leads.find((item) => item.id === id);

  if (!lead) {
    return null;
  }

  let historyPage = Math.max(1, Math.floor(prospectingHistoryPage));
  const historyPageSize = 5;
  let prospectingHistory = await getSupabaseProspectingHistory(
    id,
    historyPage,
    historyPageSize,
  );
  const totalPages = Math.max(1, Math.ceil(prospectingHistory.total / historyPageSize));

  if (historyPage > totalPages) {
    historyPage = totalPages;
    prospectingHistory = await getSupabaseProspectingHistory(
      id,
      historyPage,
      historyPageSize,
    );
  }

  return {
    lead,
    submissions: getSubmissionsForLead(id, dataset.auditSubmissions),
    events: getEventsForLead(id, dataset.leadEvents),
    notes: getNotesForLead(id, dataset.leadNotes),
    prospectingHistory: prospectingHistory.rows,
    prospectingHistoryPage: historyPage,
    prospectingHistoryTotal: prospectingHistory.total,
    prospectingHistoryTotalPages: totalPages,
  };
}

export async function getAnalyticsOverview(dateRange: DateRangeKey = '7d') {
  const umami = await getUmamiAnalytics(dateRange);

  if (umami) {
    return umami;
  }

  throw new Error(
    'Live analytics is not configured. Connect Umami to load the dashboard.',
  );
}

export async function getAnalyticsSummary() {
  const overview = await getAnalyticsOverview();

  return overview.metrics;
}

export async function getAnalyticsFunnel() {
  const overview = await getAnalyticsOverview();

  return overview.funnel;
}

export async function getRoutePerformance() {
  const overview = await getAnalyticsOverview();

  return overview.topLandingPages;
}

export async function getSourcePerformance() {
  const overview = await getAnalyticsOverview();

  return {
    ctaSources: overview.ctaClicksBySource,
    referrers: overview.topReferrers,
    campaigns: overview.utmCampaignPerformance,
  };
}

export async function getLeadExportRows() {
  const dataset = await getDashboardDataset();

  return dataset.leads.map((lead) => {
    const latestSubmission = getSubmissionsForLead(lead.id, dataset.auditSubmissions)[0];

    return {
      id: lead.id,
      created_at: lead.created_at,
      name: lead.name,
      email: lead.email,
      company: lead.company,
      website: lead.website ?? '',
      icp_category: lead.icpCategory ? getIcpCategoryLabel(lead.icpCategory) : '',
      linkedin_profile_url: lead.linkedinProfileUrl ?? '',
      focus_name: lead.focusName ?? '',
      focus_title: lead.focusTitle ?? '',
      focus_linkedin_url: lead.focusLinkedinUrl ?? '',
      connection_status: lead.connectionStatus ?? '',
      last_outreach_date: lead.lastOutreachDate ?? '',
      next_follow_up_action: lead.nextFollowUpAction ?? '',
      pain_points: lead.painPoints ?? '',
      facebook_url: lead.facebookUrl ?? '',
      whatsapp: lead.whatsapp ?? '',
      status: lead.status,
      origin: lead.origin,
      created_by: lead.created_by ?? '',
      owner_user_id: lead.owner_user_id ?? '',
      marketing_source: lead.marketingSource ?? '',
      locale: lead.locale,
      pathname: lead.pathname,
      form_type: latestSubmission?.submission_type ?? '',
      project_type: latestSubmission?.project_type ?? '',
      industry: latestSubmission?.industry_segment ?? '',
      budget_range: latestSubmission?.budget_range ?? '',
      timeline: latestSubmission?.timeline ?? '',
    };
  });
}
