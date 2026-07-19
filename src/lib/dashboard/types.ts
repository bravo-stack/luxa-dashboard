export const leadStatuses = [
  'new',
  'contacted',
  'qualified',
  'won',
  'lost',
  'spam',
] as const;

export type LeadStatus = (typeof leadStatuses)[number];

export const leadOrigins = ['website', 'manual', 'import', 'integration'] as const;

export type LeadOrigin = (typeof leadOrigins)[number];

export const connectionStatuses = [
  'not_researched',
  'identified',
  'connection_sent',
  'connected',
  'contacted',
  'replied',
] as const;

export type ConnectionStatus = (typeof connectionStatuses)[number];

export type LeadPriority = 'standard' | 'review_next' | 'contact_overdue' | 'high_fit';

export type SubmissionType = 'quick_start' | 'platform_audit' | 'manual';

export type LeadEventType = string;

export type TrendDirection = 'up' | 'down' | 'flat';

export type DateRangeKey = '7d' | '14d' | '30d' | '90d';

export type AnalyticsSource = 'supabase' | 'umami';

export interface DateRange {
  key: DateRangeKey;
  label: string;
  from: string;
  to: string;
}

export interface Lead {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
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
  status: LeadStatus;
  origin: LeadOrigin;
  marketingSource?: string;
  created_by?: string;
  owner_user_id?: string;
  locale: 'en' | 'ar';
  pathname: string;
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
  dailyFormStarts?: SourceSummary[];
  dailySubmissions: SourceSummary[];
  dailyScheduleClicks: SourceSummary[];
  dailyConversionRate: SourceSummary[];
  ctaClicksBySource: SourceSummary[];
  eventVolume?: SourceSummary[];
  formPerformance?: SourceSummary[];
  industryPerformance?: SourceSummary[];
  deviceCategories?: SourceSummary[];
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
  submissions: AuditSubmission[];
  events: LeadEvent[];
  notes: LeadNote[];
}

export interface LeadListItem extends Lead {
  submissions: AuditSubmission[];
  priority: LeadPriority;
}

export interface DashboardActionResult {
  ok: boolean;
  message: string;
}
