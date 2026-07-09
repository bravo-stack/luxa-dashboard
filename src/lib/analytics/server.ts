import 'server-only';

import { cache } from 'react';

import { defaultDashboardDateRange, deviceCategories } from '@/lib/dashboard/mock-data';
import { getAnalyticsOverview, getDashboardOverview } from '@/lib/dashboard/queries';

import type {
  AnalyticsApiResponse,
  AnalyticsFilters,
  AnalyticsSummary,
  DateRangeKey,
  LeadFunnelSummary,
  RecentActivitySummary,
  TrafficSummary,
} from './types';

const allowedDateRanges: DateRangeKey[] = ['7d', '14d', '30d', '90d'];

export function normalizeAnalyticsFilters(
  filters: AnalyticsFilters = {},
): Required<Pick<AnalyticsFilters, 'dateRange'>> &
  Pick<AnalyticsFilters, 'project' | 'funnel'> {
  return {
    dateRange:
      filters.dateRange && allowedDateRanges.includes(filters.dateRange)
        ? filters.dateRange
        : defaultDashboardDateRange.key,
    project: filters.project,
    funnel: filters.funnel,
  };
}

export function getAnalyticsFiltersFromUrl(url: string) {
  const searchParams = new URL(url).searchParams;
  const range = searchParams.get('range') ?? searchParams.get('dateRange');

  return normalizeAnalyticsFilters({
    dateRange: allowedDateRanges.includes(range as DateRangeKey)
      ? (range as DateRangeKey)
      : undefined,
    project: searchParams.get('project') ?? undefined,
    funnel: searchParams.get('funnel') ?? undefined,
  });
}

function withEnvelope<T>(
  data: T,
  source: AnalyticsSummary['source'],
  filters: ReturnType<typeof normalizeAnalyticsFilters>,
): AnalyticsApiResponse<T> {
  return {
    data,
    source,
    filters,
  };
}

export const getDashboardAnalytics = cache(async (filters: AnalyticsFilters = {}) => {
  const normalized = normalizeAnalyticsFilters(filters);

  return getAnalyticsOverview(normalized.dateRange);
});

export async function getDashboardMetrics(filters: AnalyticsFilters = {}) {
  const analytics = await getDashboardAnalytics(filters);

  return analytics.metrics;
}

export async function getTrafficSummary(
  filters: AnalyticsFilters = {},
): Promise<TrafficSummary> {
  const analytics = await getDashboardAnalytics(filters);

  return {
    dailyVisitors: analytics.dailyVisitors,
    dailySubmissions: analytics.dailySubmissions,
    dailyScheduleClicks: analytics.dailyScheduleClicks,
    dailyConversionRate: analytics.dailyConversionRate,
    topLandingPages: analytics.topLandingPages,
    topReferrers: analytics.topReferrers,
    ctaClicksBySource: analytics.ctaClicksBySource,
    utmCampaignPerformance: analytics.utmCampaignPerformance,
    deviceCategories,
  };
}

export async function getLeadFunnelSummary(
  filters: AnalyticsFilters = {},
): Promise<LeadFunnelSummary> {
  const analytics = await getDashboardAnalytics(filters);

  return {
    funnel: analytics.funnel,
    submissionsByProjectType: analytics.submissionsByProjectType,
    submissionsByIndustry: analytics.submissionsByIndustry,
    submissionsByBudget: analytics.submissionsByBudget,
    submissionsByTimeline: analytics.submissionsByTimeline,
  };
}

export async function getRecentActivity(
  filters: AnalyticsFilters = {},
): Promise<RecentActivitySummary> {
  const normalized = normalizeAnalyticsFilters(filters);
  const overview = await getDashboardOverview(normalized.dateRange);

  return {
    recentSubmissions: overview.recentSubmissions,
    needsAttention: overview.needsAttention,
  };
}

export async function getDashboardAnalyticsResponse(filters: AnalyticsFilters = {}) {
  const normalized = normalizeAnalyticsFilters(filters);
  const analytics = await getDashboardAnalytics(normalized);

  return withEnvelope(analytics, analytics.source, normalized);
}

export async function getDashboardMetricsResponse(filters: AnalyticsFilters = {}) {
  const normalized = normalizeAnalyticsFilters(filters);
  const analytics = await getDashboardAnalytics(normalized);

  return withEnvelope(analytics.metrics, analytics.source, normalized);
}

export async function getTrafficSummaryResponse(filters: AnalyticsFilters = {}) {
  const normalized = normalizeAnalyticsFilters(filters);
  const analytics = await getDashboardAnalytics(normalized);

  return withEnvelope(await getTrafficSummary(normalized), analytics.source, normalized);
}

export async function getLeadFunnelSummaryResponse(filters: AnalyticsFilters = {}) {
  const normalized = normalizeAnalyticsFilters(filters);
  const analytics = await getDashboardAnalytics(normalized);

  return withEnvelope(
    await getLeadFunnelSummary(normalized),
    analytics.source,
    normalized,
  );
}

export async function getRecentActivityResponse(filters: AnalyticsFilters = {}) {
  const normalized = normalizeAnalyticsFilters(filters);
  const analytics = await getDashboardAnalytics(normalized);

  return withEnvelope(await getRecentActivity(normalized), analytics.source, normalized);
}
