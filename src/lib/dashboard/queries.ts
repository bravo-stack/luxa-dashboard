import { getAnalyticsSnapshot } from './analytics-snapshots';
import {
  analyticsSummary,
  auditSubmissions,
  dashboardDateRanges,
  dashboardMetrics,
  defaultDashboardDateRange,
  deviceCategories,
  funnelSteps,
  leads,
  pipelineStages,
  topCtaSources,
  topReferrers,
  topRoutes,
  topUtmCampaigns,
} from './mock-data';
import type { DashboardOverview, DateRangeKey, LeadDetail, LeadListItem } from './types';
import {
  getLeadEvents,
  getLeadNotes,
  getLeadOwner,
  getLeadPriority,
  getLeadSubmissions,
  isAwaitingReply,
  isContactedWithoutNextStep,
  isQualifiedNotScheduled,
  isStaleLead,
} from './utils';

function getDateRange(key: DateRangeKey = '7d') {
  return (
    dashboardDateRanges.find((range) => range.key === key) ?? defaultDashboardDateRange
  );
}

export async function getDashboardOverview(
  dateRange: DateRangeKey = '7d',
): Promise<DashboardOverview> {
  const staleLeads = leads.filter(isStaleLead);
  const leadsWithoutOwner = leads.filter(
    (lead) => !lead.owner_user_id && lead.status !== 'archived',
  );
  const qualifiedNotScheduled = leads.filter(isQualifiedNotScheduled);
  const contactedWithoutNextStep = leads.filter(isContactedWithoutNextStep);
  const highScoreNoActivity = leads.filter(
    (lead) => lead.qualification_score >= 88 && !lead.last_contacted_at,
  );
  const recentSubmissions = auditSubmissions
    .slice()
    .sort((first, second) => {
      const typeWeight =
        Number(second.submission_type === 'full_audit') -
        Number(first.submission_type === 'full_audit');

      if (typeWeight !== 0) {
        return typeWeight;
      }

      return new Date(second.created_at).getTime() - new Date(first.created_at).getTime();
    })
    .slice(0, 5)
    .map((submission) => {
      const lead = leads.find((item) => item.id === submission.lead_id);

      if (!lead) {
        throw new Error(`Missing lead for submission ${submission.id}`);
      }

      return {
        lead,
        submission,
        owner: getLeadOwner(lead),
      };
    });

  return {
    dateRange: getDateRange(dateRange),
    metrics: dashboardMetrics,
    pipeline: pipelineStages,
    funnel: funnelSteps,
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
    topRoutes,
    topCtaSources,
    topUtmCampaigns,
    topReferrers,
    deviceCategories,
    leadQuality: [
      {
        label: 'High-fit lead',
        value: leads.filter((lead) => lead.qualification_score >= 88).length,
        context: 'Score of 88 or higher',
        priority: 'high_fit',
      },
      {
        label: 'Awaiting reply',
        value: leads.filter(isAwaitingReply).length,
        context: 'New or qualified with no contact',
        priority: 'contact_overdue',
      },
      {
        label: 'Ready for proposal',
        value: leads.filter((lead) => lead.status === 'proposal_ready').length,
        context: 'Next action is proposal review',
        priority: 'review_next',
      },
    ],
  };
}

export async function getLeads(): Promise<LeadListItem[]> {
  return leads.map((lead) => ({
    ...lead,
    owner: getLeadOwner(lead),
    submissions: getLeadSubmissions(lead.id),
    priority: getLeadPriority(lead),
  }));
}

export async function getLeadDetail(id: string): Promise<LeadDetail | null> {
  const lead = leads.find((item) => item.id === id);

  if (!lead) {
    return null;
  }

  return {
    lead,
    owner: getLeadOwner(lead),
    submissions: getLeadSubmissions(id),
    events: getLeadEvents(id),
    notes: getLeadNotes(id),
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
  return leads.map((lead) => {
    const latestSubmission = getLeadSubmissions(lead.id)[0];

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
