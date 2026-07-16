import type {
  AnalyticsSource,
  AnalyticsSummary,
  DateRangeKey,
  FunnelStepSummary,
  MetricSummary,
  NeedsAttentionItem,
  RecentSubmissionItem,
  SourceSummary,
} from '@/lib/dashboard/types';

export type {
  AnalyticsSource,
  AnalyticsSummary,
  DateRangeKey,
  FunnelStepSummary,
  MetricSummary,
  NeedsAttentionItem,
  RecentSubmissionItem,
  SourceSummary,
};

export type AnalyticsFilters = {
  dateRange?: DateRangeKey;
  project?: string;
  funnel?: string;
};

export type AnalyticsApiResponse<T> = {
  data: T;
  source: AnalyticsSource | 'noop';
  filters: Required<Pick<AnalyticsFilters, 'dateRange'>> &
    Pick<AnalyticsFilters, 'project' | 'funnel'>;
};

export type TrafficSummary = {
  dailyVisitors: SourceSummary[];
  dailyFormStarts: SourceSummary[];
  dailySubmissions: SourceSummary[];
  dailyScheduleClicks: SourceSummary[];
  dailyConversionRate: SourceSummary[];
  topLandingPages: SourceSummary[];
  topReferrers: SourceSummary[];
  ctaClicksBySource: SourceSummary[];
  utmCampaignPerformance: SourceSummary[];
  deviceCategories: SourceSummary[];
  eventVolume: SourceSummary[];
};

export type LeadFunnelSummary = {
  funnel: FunnelStepSummary[];
  submissionsByProjectType: SourceSummary[];
  submissionsByIndustry: SourceSummary[];
  submissionsByBudget: SourceSummary[];
  submissionsByTimeline: SourceSummary[];
  formPerformance: SourceSummary[];
  industryPerformance: SourceSummary[];
};

export type RecentActivitySummary = {
  recentSubmissions: RecentSubmissionItem[];
  needsAttention: NeedsAttentionItem[];
};
