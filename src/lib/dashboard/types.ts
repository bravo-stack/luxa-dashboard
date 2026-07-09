export const leadStatuses = [
  'new',
  'qualified',
  'contacted',
  'scheduled',
  'proposal_ready',
  'converted',
  'won',
  'lost',
  'archived',
] as const;

export type LeadStatus = (typeof leadStatuses)[number];

export type LeadPriority = 'standard' | 'review_next' | 'contact_overdue' | 'high_fit';

export type SubmissionType = 'quick_start' | 'full_audit';

export type LeadEventType = string;

export type TrendDirection = 'up' | 'down' | 'flat';

export type DateRangeKey = '7d' | '14d' | '30d' | '90d';

export type AnalyticsSource = 'supabase' | 'umami' | 'mock';

export interface DateRange {
  key: DateRangeKey;
  label: string;
  from: string;
  to: string;
}

export interface LeadOwner {
  id: string;
  name: string;
  initials: string;
  role: string;
  avatar_url?: string;
}

export interface Lead {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  company: string;
  website?: string;
  status: LeadStatus;
  source: string;
  owner_user_id: string | null;
  last_contacted_at: string | null;
  qualification_score: number;
}

export interface AuditSubmission {
  id: string;
  lead_id: string;
  created_at: string;
  submission_type: SubmissionType;
  source: string;
  project_type: string;
  industry_segment: string;
  system_status: string;
  problems: string;
  improve_first: string;
  budget_range: string;
  timeline: string;
  decision_stage: string;
  preferred_next_step: string;
  extra_context: string;
  raw_payload: Record<string, unknown>;
}

export interface LeadEvent {
  id: string;
  lead_id: string | null;
  created_at: string;
  event_type: LeadEventType;
  event_name?: string;
  source: string;
  metadata: Record<string, string | number | boolean | null>;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  created_at: string;
  created_by: string;
  body: string;
}

export interface MetricSummary {
  key: string;
  label: string;
  value: number | string;
  trend: string;
  trendDirection: TrendDirection;
  note: string;
}

export interface PipelineStageSummary {
  status: LeadStatus;
  label: string;
  count: number;
  value: string;
  intent: 'neutral' | 'primary' | 'violet' | 'teal' | 'warm' | 'destructive';
}

export interface FunnelStepSummary {
  key: string;
  label: string;
  value: number;
  rate: number;
  delta: string;
}

export interface SourceSummary {
  key: string;
  label: string;
  value: number;
  context: string;
  trend?: string;
}

export interface LeadQualitySummary {
  label: string;
  value: number;
  context: string;
  priority: LeadPriority;
}

export interface NeedsAttentionItem {
  id: string;
  label: string;
  count: number;
  description: string;
  priority: LeadPriority;
  leadIds: string[];
}

export interface RecentSubmissionItem {
  lead: Lead;
  submission: AuditSubmission;
  owner?: LeadOwner;
}

export interface DashboardOverview {
  dateRange: DateRange;
  metrics: MetricSummary[];
  pipeline: PipelineStageSummary[];
  funnel: FunnelStepSummary[];
  recentSubmissions: RecentSubmissionItem[];
  needsAttention: NeedsAttentionItem[];
  topRoutes: SourceSummary[];
  topCtaSources: SourceSummary[];
  topUtmCampaigns: SourceSummary[];
  topReferrers: SourceSummary[];
  deviceCategories: SourceSummary[];
  leadQuality: LeadQualitySummary[];
}

export interface AnalyticsSummary {
  dateRange: DateRange;
  metrics: MetricSummary[];
  funnel: FunnelStepSummary[];
  dailyVisitors: SourceSummary[];
  dailySubmissions: SourceSummary[];
  dailyScheduleClicks: SourceSummary[];
  dailyConversionRate: SourceSummary[];
  ctaClicksBySource: SourceSummary[];
  submissionsByProjectType: SourceSummary[];
  submissionsByIndustry: SourceSummary[];
  submissionsByBudget: SourceSummary[];
  submissionsByTimeline: SourceSummary[];
  topLandingPages: SourceSummary[];
  topReferrers: SourceSummary[];
  utmCampaignPerformance: SourceSummary[];
  source: AnalyticsSource;
}

export interface LeadDetail {
  lead: Lead;
  owner?: LeadOwner;
  submissions: AuditSubmission[];
  events: LeadEvent[];
  notes: LeadNote[];
}

export interface LeadListItem extends Lead {
  owner?: LeadOwner;
  submissions: AuditSubmission[];
  priority: LeadPriority;
}

export interface DashboardActionResult {
  ok: boolean;
  message: string;
}
