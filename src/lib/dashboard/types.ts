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
  'not_connected',
  'connection_sent',
  'connected',
  'contacted',
  'replied',
] as const;

export type ConnectionStatus = (typeof connectionStatuses)[number];

export const icpCategories = [
  { value: 'hospital', label: 'Hospitals' },
  { value: 'school', label: 'Schools' },
  { value: 'logistics', label: 'Logistics companies' },
  { value: 'digital_marketing_agency', label: 'Digital marketing agencies' },
  { value: 'clinic', label: 'Clinics' },
  { value: 'online_learning_platform', label: 'Online learning platforms' },
  { value: 'supply_chain', label: 'Supply chain businesses' },
  { value: 'factory_manufacturing', label: 'Factories & manufacturing' },
  {
    value: 'real_estate_property_management',
    label: 'Real estate & property management',
  },
  { value: 'oil_gas', label: 'Oil & gas firms' },
  { value: 'other', label: 'Other / needs review' },
  { value: 'not_icp', label: 'Not ICP / disqualified' },
] as const;

export type IcpCategory = (typeof icpCategories)[number]['value'];

export const buyerFunctions = [
  { value: 'executive_leadership', label: 'Executive leadership' },
  { value: 'operations', label: 'Operations' },
  { value: 'human_resources', label: 'Human resources' },
  { value: 'sales_revenue', label: 'Sales & revenue' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'information_technology', label: 'IT / technology' },
  { value: 'finance_procurement', label: 'Finance & procurement' },
  { value: 'learning_development', label: 'Learning & development' },
  { value: 'other', label: 'Other / unknown' },
] as const;

export type BuyerFunction = (typeof buyerFunctions)[number]['value'];

export const leadDeletionRequestStatuses = ['pending', 'approved', 'rejected'] as const;

export type LeadDeletionRequestStatus = (typeof leadDeletionRequestStatuses)[number];

export type LeadOwnershipScope = 'all' | 'mine' | 'shared';

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
  phone?: string;
  icpCategory?: string;
  buyerFunction?: string;
  linkedinProfileUrl?: string;
  focusName?: string;
  focusTitle?: string;
  focusLinkedinUrl?: string;
  connectionStatus?: ConnectionStatus;
  lastOutreachDate?: string;
  nextFollowUpAction?: string;
  nextFollowUpDate?: string;
  painPoints?: string;
  qualificationNotes?: string;
  outcomeReason?: string;
  facebookUrl?: string;
  whatsapp?: string;
  projectType: string;
  industry?: string;
  systemStatus?: string;
  problems?: string;
  improveFirst?: string;
  budget?: string;
  timeline?: string;
  decisionStage?: string;
  context?: string;
  nextStep?: string;
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
  updated_at: string;
  created_by: string;
  body: string;
}

export type LeadProspectingHistory = Pick<
  Lead,
  | 'icpCategory'
  | 'buyerFunction'
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
> & {
  id: string;
  lead_id: string;
  created_at: string;
  captureType: 'created' | 'updated' | 'backfilled';
};

export interface LeadDeletionRequest {
  id: string;
  leadId?: string;
  leadName: string;
  leadEmail: string;
  leadCompany: string;
  requestedAt: string;
  requestedBy?: string;
  requestedByName: string;
  reason: string;
  status: LeadDeletionRequestStatus;
  reviewedAt?: string;
  reviewedByName?: string;
  reviewNote?: string;
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
  secondaryValue?: number;
  secondaryLabel?: string;
  rate?: number;
}

export interface PageQualitySummary extends SourceSummary {
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  bounceRate: number;
  averageTimeSeconds: number;
}

export interface ActivityCell {
  day: number;
  hour: number;
  value: number;
}

export type WebVitalKey = 'lcp' | 'inp' | 'cls' | 'fcp' | 'ttfb';

export interface WebVitalSummary {
  key: WebVitalKey;
  label: string;
  p50: number | null;
  p75: number | null;
  p95: number | null;
  unit: 'ms' | 'score';
  rating: 'good' | 'needs-improvement' | 'poor' | 'unavailable';
}

export interface RealtimeSummary {
  activeVisitors: number;
  views: number;
  visitors: number;
  events: number;
  topPages: SourceSummary[];
  topCountries: SourceSummary[];
  updatedAt: string;
}

export interface AnalyticsAvailability {
  available: string[];
  unavailable: string[];
  lastUpdated: string;
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
  activeVisitors: number;
  dailyPageViews: SourceSummary[];
  dailyVisitors: SourceSummary[];
  dailyVisits: SourceSummary[];
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
  entryPages: SourceSummary[];
  exitPages: SourceSummary[];
  pageQuality: PageQualitySummary[];
  topReferrers: SourceSummary[];
  channels: SourceSummary[];
  countries: SourceSummary[];
  regions: SourceSummary[];
  cities: SourceSummary[];
  browsers: SourceSummary[];
  operatingSystems: SourceSummary[];
  screens: SourceSummary[];
  languages: SourceSummary[];
  utmCampaignPerformance: SourceSummary[];
  utmSources: SourceSummary[];
  utmMediums: SourceSummary[];
  utmContent: SourceSummary[];
  utmTerms: SourceSummary[];
  paidAdSources: SourceSummary[];
  weeklyActivity: ActivityCell[];
  webVitals: WebVitalSummary[];
  realtime: RealtimeSummary;
  availability: AnalyticsAvailability;
  source: AnalyticsSource;
}

export interface LeadDetail {
  lead: Lead;
  submissions: AuditSubmission[];
  events: LeadEvent[];
  notes: LeadNote[];
  prospectingHistory: LeadProspectingHistory[];
  prospectingHistoryPage: number;
  prospectingHistoryTotal: number;
  prospectingHistoryTotalPages: number;
}

export interface LeadListItem extends Lead {
  submissions: AuditSubmission[];
  priority: LeadPriority;
}

export interface DashboardActionResult {
  ok: boolean;
  message: string;
}
