import { getAnalyticsSnapshot } from './analytics-snapshots';
import {
  analyticsSummary,
  auditSubmissions as mockAuditSubmissions,
  dashboardDateRanges,
  defaultDashboardDateRange,
  deviceCategories,
  leadEvents as mockLeadEvents,
  leadNotes as mockLeadNotes,
  leads as mockLeads,
  pipelineStages as mockPipelineStages,
} from './mock-data';
import {
  type DashboardDataset,
  getSupabaseDashboardDataset,
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
  getLeadOwner,
  getLeadPriority,
  isAwaitingReply,
  isContactedWithoutNextStep,
  isQualifiedNotScheduled,
  isStaleLead,
  statusLabels,
} from './utils';

type LocalDashboardDataset = Omit<DashboardDataset, 'source'> & {
  source: 'mock' | 'supabase';
};

const pipelineIntentByStatus = new Map(
  mockPipelineStages.map((stage) => [stage.status, stage.intent]),
);

function getDateRange(key: DateRangeKey = '7d') {
  return (
    dashboardDateRanges.find((range) => range.key === key) ?? defaultDashboardDateRange
  );
}

async function getDashboardDataset(): Promise<LocalDashboardDataset> {
  const supabaseDataset = await getSupabaseDashboardDataset();

  if (supabaseDataset) {
    return supabaseDataset;
  }

  return {
    leads: mockLeads,
    auditSubmissions: mockAuditSubmissions,
    leadEvents: mockLeadEvents,
    leadNotes: mockLeadNotes,
    source: 'mock',
  };
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
    (lead) =>
      lead.status !== 'archived' &&
      lead.status !== 'lost' &&
      lead.status !== 'won' &&
      lead.status !== 'converted',
  );
  const fullAuditSubmissions = submissions.filter(
    (submission) => submission.submission_type === 'full_audit',
  );
  const scheduleClicks = events.filter(
    (event) => (event.event_name ?? event.event_type) === 'schedule_clicked',
  );

  return [
    {
      key: 'active_leads',
      label: 'Active leads',
      value: openLeads.length,
      trend: 'Live',
      trendDirection: 'flat',
      note: 'Excludes lost and archived',
    },
    {
      key: 'qualified_leads',
      label: 'Qualified leads',
      value: liveLeads.filter((lead) => lead.qualification_score >= 72).length,
      trend: 'Live',
      trendDirection: 'flat',
      note: 'Above the fit threshold',
    },
    {
      key: 'scheduled_calls',
      label: 'Scheduled calls',
      value: liveLeads.filter((lead) => lead.status === 'scheduled').length,
      trend: 'Live',
      trendDirection: 'flat',
      note: 'Discovery calls booked',
    },
    {
      key: 'awaiting_reply',
      label: 'Awaiting reply',
      value: liveLeads.filter(isAwaitingReply).length,
      trend: 'Live',
      trendDirection: 'flat',
      note: 'New or qualified without contact',
    },
    {
      key: 'full_audit_submissions',
      label: 'Full audit submissions',
      value: fullAuditSubmissions.length,
      trend: 'Live',
      trendDirection: 'flat',
      note: 'High intent audit depth',
    },
    {
      key: 'schedule_clicks',
      label: 'Schedule clicks',
      value: scheduleClicks.length,
      trend: 'Live',
      trendDirection: 'flat',
      note: 'Captured in lead events',
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
  const leadsWithoutOwner = dataset.leads.filter(
    (lead) => !lead.owner_user_id && lead.status !== 'archived',
  );
  const qualifiedNotScheduled = dataset.leads.filter(isQualifiedNotScheduled);
  const contactedWithoutNextStep = dataset.leads.filter(isContactedWithoutNextStep);
  const highScoreNoActivity = dataset.leads.filter(
    (lead) => lead.qualification_score >= 88 && !lead.last_contacted_at,
  );
  const recentSubmissions = dataset.auditSubmissions
    .filter((submission) => dataset.leads.some((lead) => lead.id === submission.lead_id))
    .sort((first, second) => {
      const typeWeight =
        Number(second.submission_type === 'full_audit') -
        Number(first.submission_type === 'full_audit');

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
        owner: lead ? getLeadOwner(lead) : undefined,
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
        id: 'no-owner',
        label: 'No owner assigned',
        count: leadsWithoutOwner.length,
        description: 'Qualified or new leads waiting for ownership',
        priority: 'review_next',
        leadIds: leadsWithoutOwner.map((lead) => lead.id),
      },
      {
        id: 'qualified-not-scheduled',
        label: 'Qualified but not scheduled',
        count: qualifiedNotScheduled.length,
        description: 'High-fit leads without a booked discovery call',
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
        id: 'high-score-no-activity',
        label: 'High-score no recent activity',
        count: highScoreNoActivity.length,
        description: 'Strong fit leads that need immediate review',
        priority: 'high_fit',
        leadIds: highScoreNoActivity.map((lead) => lead.id),
      },
    ],
    topRoutes: analyticsOverview.topLandingPages,
    topCtaSources: analyticsOverview.ctaClicksBySource,
    topUtmCampaigns: analyticsOverview.utmCampaignPerformance,
    topReferrers: analyticsOverview.topReferrers,
    deviceCategories,
    leadQuality: [
      {
        label: 'High-fit lead',
        value: dataset.leads.filter((lead) => lead.qualification_score >= 88).length,
        context: 'Score of 88 or higher',
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
        value: dataset.leads.filter((lead) => lead.status === 'proposal_ready').length,
        context: 'Next action is proposal review',
        priority: 'review_next',
      },
    ],
  };
}

export async function getLeads(): Promise<LeadListItem[]> {
  const dataset = await getDashboardDataset();

  return dataset.leads.map((lead) => ({
    ...lead,
    owner: getLeadOwner(lead),
    submissions: getSubmissionsForLead(lead.id, dataset.auditSubmissions),
    priority: getLeadPriority(lead),
  }));
}

export async function getLeadDetail(id: string): Promise<LeadDetail | null> {
  const dataset = await getDashboardDataset();
  const lead = dataset.leads.find((item) => item.id === id);

  if (!lead) {
    return null;
  }

  return {
    lead,
    owner: getLeadOwner(lead),
    submissions: getSubmissionsForLead(id, dataset.auditSubmissions),
    events: getEventsForLead(id, dataset.leadEvents),
    notes: getNotesForLead(id, dataset.leadNotes),
  };
}

export async function getAnalyticsOverview(dateRange: DateRangeKey = '7d') {
  const snapshot = await getAnalyticsSnapshot(dateRange);

  if (snapshot) {
    return {
      ...snapshot,
      dateRange: getDateRange(dateRange),
    };
  }

  return {
    ...analyticsSummary,
    dateRange: getDateRange(dateRange),
    source: 'mock' as const,
  };
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
      status: lead.status,
      source: lead.source,
      owner: getLeadOwner(lead)?.name ?? '',
      qualification_score: lead.qualification_score,
      project_type: latestSubmission?.project_type ?? '',
      budget_range: latestSubmission?.budget_range ?? '',
      timeline: latestSubmission?.timeline ?? '',
    };
  });
}
