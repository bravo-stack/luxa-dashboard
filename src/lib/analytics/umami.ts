import 'server-only';

import {
  compareTrend,
  conversionSeries,
  fillDailySeries,
  percentageRate,
} from '@/lib/analytics/math';
import {
  isCurrentPublicPath,
  leadStartEventNames,
  leadSubmissionEventNames,
  legacyAuditFunnelSteps,
  primaryAuditFunnelSteps,
  publicSiteEventNames,
} from '@/lib/analytics/public-site';
import type {
  ActivityCell,
  AnalyticsSummary,
  DateRange,
  DateRangeKey,
  FunnelStepSummary,
  MetricSummary,
  PageQualitySummary,
  RealtimeSummary,
  SourceSummary,
  WebVitalKey,
  WebVitalSummary,
} from '@/lib/dashboard/types';

const legacyEventNames = [
  'lead_form_started',
  'lead_form_step_completed',
  'lead_form_submitted',
  'book_call_clicked',
  'pricing_cta_clicked',
  'case_study_clicked',
  'lead_form_validation_failed',
  'lead_form_step_back',
  'lead_form_abandoned',
  'language_changed',
  'theme_changed',
] as const;

const umamiEventNames = [...publicSiteEventNames, ...legacyEventNames] as const;
const allLeadStartEventNames = [...leadStartEventNames, 'lead_form_started'] as const;
const allLeadSubmissionEventNames = [
  ...leadSubmissionEventNames,
  'lead_form_submitted',
] as const;
const allScheduleEventNames = ['schedule_clicked', 'book_call_clicked'] as const;

type EventName = (typeof umamiEventNames)[number];

type EventSeriesPoint = {
  x: string;
  t: string;
  y: number;
};

type MetricPoint = {
  x: string;
  y: number;
};

type PropertyValue = {
  value: string;
  total: number;
};

type UmamiStats = {
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
  comparison?: Omit<UmamiStats, 'comparison'>;
};

type UmamiPageviews = {
  pageviews: MetricPoint[];
  sessions: MetricPoint[];
};

type ExpandedMetric = {
  name: string;
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
};

type FunnelReportStep = {
  type: 'path' | 'event';
  value: string;
  visitors: number;
  previous: number;
  dropped: number;
  dropoff: number | null;
  remaining: number;
};

type AttributionReport = {
  referrer?: Array<{ name: string; value: number }>;
  paidAds?: Array<{ name: string; value: number }>;
  utm_source?: Array<{ name: string; value: number }>;
  utm_medium?: Array<{ name: string; value: number }>;
  utm_campaign?: Array<{ name: string; value: number }>;
};

type UtmReport = {
  utm_source?: Array<{ utm: string; views: number }>;
  utm_medium?: Array<{ utm: string; views: number }>;
  utm_campaign?: Array<{ utm: string; views: number }>;
  utm_content?: Array<{ utm: string; views: number }>;
  utm_term?: Array<{ utm: string; views: number }>;
};

type PerformanceValue = {
  p50: number | null;
  p75: number | null;
  p95: number | null;
};

type PerformanceReport = {
  summary?: Partial<Record<WebVitalKey, PerformanceValue>> & { count?: number };
};

type RealtimeResponse = {
  countries?: Record<string, number>;
  urls?: Record<string, number>;
  events?: unknown[];
  totals?: {
    views?: number;
    visitors?: number;
    events?: number;
  };
  timestamp?: number;
};

type UmamiConfig = {
  apiUrl: string;
  websiteId: string;
  headers: HeadersInit;
};

type Signal<T> = {
  name: string;
  result: PromiseSettledResult<T>;
};

const rangeDays: Record<DateRangeKey, number> = {
  '7d': 7,
  '14d': 14,
  '30d': 30,
  '90d': 90,
};

const eventLabels: Record<EventName, string> = {
  page_viewed: 'Tracked page views',
  cta_clicked: 'CTA clicks',
  lead_quick_start_started: 'Quick-start starts',
  lead_quick_start_submitted: 'Quick-start submissions',
  lead_audit_started: 'Audit starts',
  lead_audit_step_completed: 'Audit steps completed',
  lead_audit_submitted: 'Audit submissions',
  schedule_clicked: 'Scheduling clicks',
  email_clicked: 'Email clicks',
  selected_work_clicked: 'Selected-work clicks',
  pricing_clicked: 'Pricing clicks',
  lead_form_started: 'Previous form starts',
  lead_form_step_completed: 'Previous form steps',
  lead_form_submitted: 'Previous form submissions',
  book_call_clicked: 'Previous scheduling clicks',
  pricing_cta_clicked: 'Previous pricing clicks',
  case_study_clicked: 'Previous selected-work clicks',
  lead_form_validation_failed: 'Validation blocks',
  lead_form_step_back: 'Form step backs',
  lead_form_abandoned: 'Form abandons',
  language_changed: 'Language changes',
  theme_changed: 'Theme changes',
};

const funnelLabels: Record<string, string> = {
  '/audit': 'Audit page reached',
  lead_audit_started: 'Audit started',
  lead_audit_submitted: 'Audit submitted',
  lead_form_started: 'Audit started',
  lead_form_submitted: 'Audit submitted',
};

const vitalMeta: Record<
  WebVitalKey,
  {
    label: string;
    unit: WebVitalSummary['unit'];
    good: number;
    poor: number;
  }
> = {
  lcp: { label: 'Largest Contentful Paint', unit: 'ms', good: 2_500, poor: 4_000 },
  inp: { label: 'Interaction to Next Paint', unit: 'ms', good: 200, poor: 500 },
  cls: { label: 'Cumulative Layout Shift', unit: 'score', good: 0.1, poor: 0.25 },
  fcp: { label: 'First Contentful Paint', unit: 'ms', good: 1_800, poor: 3_000 },
  ttfb: { label: 'Time to First Byte', unit: 'ms', good: 800, poor: 1_800 },
};

function getConfig(): UmamiConfig | null {
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const apiKey = process.env.UMAMI_API_KEY;
  const token = process.env.UMAMI_API_TOKEN;
  const explicitApiUrl = process.env.UMAMI_API_URL;
  const publicHost = process.env.NEXT_PUBLIC_UMAMI_HOST_URL;
  const apiUrl = (explicitApiUrl ?? (publicHost ? `${publicHost}/api` : '')).replace(
    /\/+$/,
    '',
  );

  if (!websiteId || !apiUrl || (!apiKey && !token)) {
    return null;
  }

  return {
    apiUrl,
    websiteId,
    headers: apiKey
      ? { Accept: 'application/json', 'x-umami-api-key': apiKey }
      : { Accept: 'application/json', Authorization: `Bearer ${token}` },
  };
}

function getDateRange(key: DateRangeKey) {
  const endAt = Date.now();
  const startAt = endAt - rangeDays[key] * 24 * 60 * 60 * 1_000;
  const previousStartAt = startAt - rangeDays[key] * 24 * 60 * 60 * 1_000;

  return { startAt, endAt, previousStartAt };
}

function rangeParams(startAt: number, endAt: number, extras = {}) {
  return new URLSearchParams({
    startAt: String(startAt),
    endAt: String(endAt),
    unit: 'day',
    timezone: 'UTC',
    ...extras,
  });
}

async function requestJson<T>(
  config: UmamiConfig,
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(`${config.apiUrl}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: body
      ? { ...config.headers, 'Content-Type': 'application/json' }
      : config.headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    throw new Error(`Umami request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

function unwrapArray<T>(value: T[] | { data?: T[] }): T[] {
  return Array.isArray(value) ? value : (value.data ?? []);
}

function fulfilled<T>(signal: Signal<T>, fallback: T): T {
  return signal.result.status === 'fulfilled' ? signal.result.value : fallback;
}

function metric(
  key: string,
  label: string,
  value: number | string,
  current: number,
  previous: number,
  note: string,
  inverseTrend = false,
): MetricSummary {
  const change = compareTrend(current, previous);
  const trendDirection =
    inverseTrend && change.direction !== 'flat'
      ? change.direction === 'up'
        ? 'down'
        : 'up'
      : change.direction;

  return {
    key,
    label,
    value,
    trend: change.label,
    trendDirection,
    note,
  };
}

function totalEvents(points: EventSeriesPoint[], eventName: EventName) {
  return points
    .filter((point) => point.x === eventName)
    .reduce((total, point) => total + point.y, 0);
}

function totalEventGroup(points: EventSeriesPoint[], eventNames: readonly string[]) {
  const includedEvents = new Set<string>(eventNames);

  return points
    .filter((point) => includedEvents.has(point.x))
    .reduce((total, point) => total + point.y, 0);
}

function labelValue(value: string) {
  if (value === '') {
    return 'Direct';
  }

  if (value.startsWith('/')) {
    return value === '/'
      ? 'Home'
      : value
          .split('/')
          .filter(Boolean)
          .map((part) => part.replaceAll('-', ' '))
          .join(' / ');
  }

  return value
    .replace(/^https?:\/\//, '')
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function toSummary(
  values: Array<{
    value?: string | number;
    total?: number;
    name?: string;
    x?: string;
    y?: number;
    utm?: string;
    views?: number;
  }>,
  context: string,
  limit = 8,
): SourceSummary[] {
  return values
    .map((item) => {
      const key =
        typeof item.value === 'string'
          ? item.value
          : (item.name ?? item.x ?? item.utm ?? '');
      const value =
        item.total ??
        item.y ??
        item.views ??
        (typeof item.value === 'number' ? item.value : 0);

      return { key, value };
    })
    .filter((item) => item.key.length > 0 && Number.isFinite(item.value))
    .sort((first, second) => second.value - first.value)
    .slice(0, limit)
    .map((item) => ({
      key: item.key,
      label: labelValue(item.key),
      value: item.value,
      context,
    }));
}

function mergeValues(groups: PropertyValue[][]) {
  const totals = new Map<string, number>();

  for (const group of groups) {
    for (const item of group) {
      totals.set(item.value, (totals.get(item.value) ?? 0) + item.total);
    }
  }

  return Array.from(totals, ([value, total]) => ({ value, total }));
}

function mergeFormValues(groups: PropertyValue[][]) {
  return mergeValues(
    groups.map((group) =>
      group.map((item) => {
        const normalized = item.value.toLowerCase().replaceAll('-', '_');
        const value = normalized.includes('quick')
          ? 'quick_start'
          : normalized.includes('audit')
            ? 'platform_audit'
            : normalized;

        return { value, total: item.total };
      }),
    ),
  );
}

function pageQuality(items: ExpandedMetric[]): PageQualitySummary[] {
  return items
    .filter((item) => isCurrentPublicPath(item.name))
    .slice()
    .sort((first, second) => second.pageviews - first.pageviews)
    .slice(0, 10)
    .map((item) => ({
      key: item.name,
      label: labelValue(item.name),
      value: item.pageviews,
      context: 'Native page views',
      pageviews: item.pageviews,
      visitors: item.visitors,
      visits: item.visits,
      bounces: item.bounces,
      bounceRate: percentageRate(item.bounces, item.visits),
      averageTimeSeconds:
        item.visits > 0 ? Number((item.totaltime / item.visits / 1_000).toFixed(1)) : 0,
    }));
}

function fallbackFunnel(
  points: EventSeriesPoint[],
  previousPoints: EventSeriesPoint[],
): FunnelStepSummary[] {
  const steps: EventName[] =
    totalEventGroup(points, ['lead_audit_started', 'lead_audit_submitted']) > 0
      ? ['lead_audit_started', 'lead_audit_submitted']
      : ['lead_form_started', 'lead_form_submitted'];
  const baseline = totalEvents(points, steps[0] ?? 'lead_audit_started');

  return steps.map((eventName, index) => {
    const value = totalEvents(points, eventName);

    return {
      key: eventName,
      label: index === 0 ? 'Audit started' : 'Audit submitted',
      value,
      rate: percentageRate(value, baseline),
      delta: compareTrend(value, totalEvents(previousPoints, eventName)).label,
    };
  });
}

function orderedFunnel(
  report: FunnelReportStep[],
  points: EventSeriesPoint[],
  previousPoints: EventSeriesPoint[],
): FunnelStepSummary[] {
  if (report.length < 2 || !report.some((step) => step.visitors > 0)) {
    return fallbackFunnel(points, previousPoints);
  }

  const baseline = report[0]?.visitors ?? 0;

  return report.map((step) => ({
    key: step.value,
    label: funnelLabels[step.value] ?? labelValue(step.value),
    value: step.visitors,
    rate:
      baseline > 0
        ? percentageRate(step.visitors, baseline)
        : Number((step.remaining * 100).toFixed(1)),
    delta:
      step.dropoff === null ? 'Entry' : `${Math.round(step.dropoff * 100)}% drop-off`,
  }));
}

function weeklyActivity(matrix: number[][]): ActivityCell[] {
  return matrix.flatMap((hours, day) =>
    hours.map((value, hour) => ({ day, hour, value: Number(value) || 0 })),
  );
}

function vitalRating(
  value: number | null,
  meta: (typeof vitalMeta)[WebVitalKey],
): WebVitalSummary['rating'] {
  if (value === null) {
    return 'unavailable';
  }

  if (value <= meta.good) {
    return 'good';
  }

  return value <= meta.poor ? 'needs-improvement' : 'poor';
}

function webVitals(report: PerformanceReport): WebVitalSummary[] {
  return (Object.keys(vitalMeta) as WebVitalKey[]).map((key) => {
    const meta = vitalMeta[key];
    const values = report.summary?.[key];
    const p75 = values?.p75 ?? null;

    return {
      key,
      label: meta.label,
      p50: values?.p50 ?? null,
      p75,
      p95: values?.p95 ?? null,
      unit: meta.unit,
      rating: vitalRating(p75, meta),
    };
  });
}

function objectSummary(
  values: Record<string, number> | undefined,
  context: string,
): SourceSummary[] {
  return toSummary(
    Object.entries(values ?? {}).map(([name, value]) => ({ name, total: value })),
    context,
  );
}

function realtimeSummary(
  realtime: RealtimeResponse,
  activeVisitors: number,
): RealtimeSummary {
  const currentUrls = Object.fromEntries(
    Object.entries(realtime.urls ?? {}).filter(([path]) => isCurrentPublicPath(path)),
  );

  return {
    activeVisitors,
    views: realtime.totals?.views ?? 0,
    visitors: realtime.totals?.visitors ?? 0,
    events: realtime.totals?.events ?? realtime.events?.length ?? 0,
    topPages: objectSummary(currentUrls, 'Last 30 minutes'),
    topCountries: objectSummary(realtime.countries, 'Last 30 minutes'),
    updatedAt: new Date(realtime.timestamp ?? Date.now()).toISOString(),
  };
}

function signalAvailability(signals: Array<Signal<unknown>>) {
  return {
    available: signals
      .filter((signal) => signal.result.status === 'fulfilled')
      .map((signal) => signal.name),
    unavailable: signals
      .filter((signal) => signal.result.status === 'rejected')
      .map((signal) => signal.name),
    lastUpdated: new Date().toISOString(),
  };
}

async function getEventSeries(config: UmamiConfig, startAt: number, endAt: number) {
  const result = await requestJson<EventSeriesPoint[] | { data?: EventSeriesPoint[] }>(
    config,
    `/websites/${config.websiteId}/events/series?${rangeParams(startAt, endAt)}`,
  );

  return unwrapArray(result).filter(
    (point) =>
      typeof point.x === 'string' &&
      typeof point.t === 'string' &&
      Number.isFinite(point.y),
  );
}

async function getPropertyValues(
  config: UmamiConfig,
  startAt: number,
  endAt: number,
  event: EventName,
  propertyName: string,
) {
  const params = rangeParams(startAt, endAt, { event, propertyName });
  const result = await requestJson<PropertyValue[] | { data?: PropertyValue[] }>(
    config,
    `/websites/${config.websiteId}/event-data/values?${params}`,
  );

  return unwrapArray(result).filter(
    (item) =>
      typeof item.value === 'string' &&
      item.value.length > 0 &&
      Number.isFinite(item.total),
  );
}

async function getPropertyValuesForEvents(
  config: UmamiConfig,
  startAt: number,
  endAt: number,
  events: readonly EventName[],
  propertyName: string,
) {
  const groups = await Promise.all(
    events.map((event) => getPropertyValues(config, startAt, endAt, event, propertyName)),
  );

  return mergeValues(groups);
}

async function getMetric(
  config: UmamiConfig,
  startAt: number,
  endAt: number,
  type: string,
) {
  return requestJson<MetricPoint[]>(
    config,
    `/websites/${config.websiteId}/metrics?${rangeParams(startAt, endAt, {
      type,
    })}`,
  );
}

export async function getUmamiAnalytics(
  dateRangeKey: DateRangeKey,
): Promise<AnalyticsSummary | null> {
  const config = getConfig();

  if (!config) {
    return null;
  }

  const { startAt, endAt, previousStartAt } = getDateRange(dateRangeKey);
  const reportParameters = {
    startDate: new Date(startAt).toISOString(),
    endDate: new Date(endAt).toISOString(),
    timezone: 'UTC',
  };
  const requests = [
    [
      'stats',
      requestJson<UmamiStats>(
        config,
        `/websites/${config.websiteId}/stats?${rangeParams(startAt, endAt, {
          compare: 'prev',
        })}`,
      ),
    ],
    [
      'traffic-series',
      requestJson<UmamiPageviews>(
        config,
        `/websites/${config.websiteId}/pageviews?${rangeParams(startAt, endAt, {
          compare: 'prev',
        })}`,
      ),
    ],
    [
      'active-visitors',
      requestJson<{ visitors: number }>(config, `/websites/${config.websiteId}/active`),
    ],
    ['realtime', requestJson<RealtimeResponse>(config, `/realtime/${config.websiteId}`)],
    ['events', getEventSeries(config, startAt, endAt)],
    ['previous-events', getEventSeries(config, previousStartAt, startAt)],
    [
      'page-quality',
      requestJson<ExpandedMetric[]>(
        config,
        `/websites/${config.websiteId}/metrics/expanded?${rangeParams(startAt, endAt, {
          type: 'path',
        })}`,
      ),
    ],
    ['channels', getMetric(config, startAt, endAt, 'channel')],
    ['entry-pages', getMetric(config, startAt, endAt, 'entry')],
    ['exit-pages', getMetric(config, startAt, endAt, 'exit')],
    ['referrers', getMetric(config, startAt, endAt, 'referrer')],
    ['devices', getMetric(config, startAt, endAt, 'device')],
    ['browsers', getMetric(config, startAt, endAt, 'browser')],
    ['operating-systems', getMetric(config, startAt, endAt, 'os')],
    ['countries', getMetric(config, startAt, endAt, 'country')],
    ['regions', getMetric(config, startAt, endAt, 'region')],
    ['cities', getMetric(config, startAt, endAt, 'city')],
    ['languages', getMetric(config, startAt, endAt, 'language')],
    ['screens', getMetric(config, startAt, endAt, 'screen')],
    [
      'weekly-activity',
      requestJson<number[][]>(
        config,
        `/websites/${config.websiteId}/sessions/weekly?${rangeParams(startAt, endAt)}`,
      ),
    ],
    [
      'performance',
      requestJson<PerformanceReport>(config, '/reports/performance', {
        websiteId: config.websiteId,
        type: 'performance',
        filters: {},
        parameters: reportParameters,
      }),
    ],
    [
      'ordered-funnel',
      requestJson<FunnelReportStep[]>(config, '/reports/funnel', {
        websiteId: config.websiteId,
        type: 'funnel',
        filters: {},
        parameters: {
          ...reportParameters,
          steps: primaryAuditFunnelSteps,
          window: rangeDays[dateRangeKey],
        },
      }),
    ],
    [
      'legacy-ordered-funnel',
      requestJson<FunnelReportStep[]>(config, '/reports/funnel', {
        websiteId: config.websiteId,
        type: 'funnel',
        filters: {},
        parameters: {
          ...reportParameters,
          steps: legacyAuditFunnelSteps,
          window: rangeDays[dateRangeKey],
        },
      }),
    ],
    [
      'attribution',
      requestJson<AttributionReport>(config, '/reports/attribution', {
        websiteId: config.websiteId,
        type: 'attribution',
        filters: {},
        parameters: {
          ...reportParameters,
          model: 'first-click',
          type: 'event',
          step: 'lead_audit_submitted',
        },
      }),
    ],
    [
      'legacy-attribution',
      requestJson<AttributionReport>(config, '/reports/attribution', {
        websiteId: config.websiteId,
        type: 'attribution',
        filters: {},
        parameters: {
          ...reportParameters,
          model: 'first-click',
          type: 'event',
          step: 'lead_form_submitted',
        },
      }),
    ],
    [
      'utm',
      requestJson<UtmReport>(config, '/reports/utm', {
        websiteId: config.websiteId,
        type: 'utm',
        filters: {},
        parameters: reportParameters,
      }),
    ],
    [
      'industry-values',
      getPropertyValuesForEvents(
        config,
        startAt,
        endAt,
        leadSubmissionEventNames,
        'industry_segment',
      ),
    ],
    [
      'legacy-form-values',
      getPropertyValues(config, startAt, endAt, 'lead_form_submitted', 'form'),
    ],
    [
      'legacy-industry-values',
      getPropertyValues(config, startAt, endAt, 'lead_form_submitted', 'industry'),
    ],
    [
      'project-type-values',
      getPropertyValuesForEvents(
        config,
        startAt,
        endAt,
        leadSubmissionEventNames,
        'project_type',
      ),
    ],
    [
      'budget-values',
      getPropertyValuesForEvents(
        config,
        startAt,
        endAt,
        leadSubmissionEventNames,
        'budget_range',
      ),
    ],
    [
      'timeline-values',
      getPropertyValuesForEvents(
        config,
        startAt,
        endAt,
        leadSubmissionEventNames,
        'timeline',
      ),
    ],
    [
      'conversion-sources',
      getPropertyValuesForEvents(
        config,
        startAt,
        endAt,
        [
          'cta_clicked',
          'schedule_clicked',
          'email_clicked',
          'selected_work_clicked',
          'pricing_clicked',
        ],
        'source',
      ),
    ],
    [
      'legacy-conversion-sources',
      getPropertyValuesForEvents(
        config,
        startAt,
        endAt,
        [
          'book_call_clicked',
          'email_clicked',
          'pricing_cta_clicked',
          'case_study_clicked',
        ],
        'placement',
      ),
    ],
  ] as const;
  const settled = await Promise.allSettled(requests.map(([, request]) => request));
  const signals = requests.map(([name], index) => ({
    name,
    result: settled[index],
  })) as Array<Signal<unknown>>;
  const byName = new Map(signals.map((signal) => [signal.name, signal]));
  const read = <T>(name: string, fallback: T) =>
    fulfilled(
      (byName.get(name) ?? { name, result: { status: 'rejected' } }) as Signal<T>,
      fallback,
    );
  const stats = read<UmamiStats>('stats', {
    pageviews: 0,
    visitors: 0,
    visits: 0,
    bounces: 0,
    totaltime: 0,
  });
  const points = read<EventSeriesPoint[]>('events', []);

  if (
    stats.pageviews === 0 &&
    points.length === 0 &&
    byName.get('stats')?.result.status === 'rejected'
  ) {
    return null;
  }

  const previousPoints = read<EventSeriesPoint[]>('previous-events', []);
  const traffic = read<UmamiPageviews>('traffic-series', {
    pageviews: [],
    sessions: [],
  });
  const comparison = stats.comparison ?? {
    pageviews: 0,
    visitors: 0,
    visits: 0,
    bounces: 0,
    totaltime: 0,
  };
  const submissions = totalEventGroup(points, allLeadSubmissionEventNames);
  const previousSubmissions = totalEventGroup(
    previousPoints,
    allLeadSubmissionEventNames,
  );
  const conversionRate = percentageRate(submissions, stats.visitors);
  const previousConversionRate = percentageRate(previousSubmissions, comparison.visitors);
  const bounceRate = percentageRate(stats.bounces, stats.visits);
  const previousBounceRate = percentageRate(comparison.bounces, comparison.visits);
  const averageVisitSeconds =
    stats.visits > 0 ? Math.round(stats.totaltime / stats.visits / 1_000) : 0;
  const previousAverageVisitSeconds =
    comparison.visits > 0
      ? Math.round(comparison.totaltime / comparison.visits / 1_000)
      : 0;
  const dailyPageViews = fillDailySeries(
    traffic.pageviews,
    startAt,
    endAt,
    'Native page views',
  );
  const dailyVisitors = fillDailySeries(
    traffic.sessions,
    startAt,
    endAt,
    'Unique visitors',
  );
  const dailyFormStarts = fillDailySeries(
    points,
    startAt,
    endAt,
    'First form interactions',
    allLeadStartEventNames,
  );
  const dailySubmissions = fillDailySeries(
    points,
    startAt,
    endAt,
    'Validated submissions',
    allLeadSubmissionEventNames,
  );
  const hasCurrentAuditEvents =
    totalEventGroup(points, ['lead_audit_started', 'lead_audit_submitted']) > 0;
  const orderedFunnelReport = read<FunnelReportStep[]>(
    hasCurrentAuditEvents ? 'ordered-funnel' : 'legacy-ordered-funnel',
    [],
  );
  const attribution = read<AttributionReport>(
    hasCurrentAuditEvents ? 'attribution' : 'legacy-attribution',
    {},
  );
  const utm = read<UtmReport>('utm', {});
  const formValues = mergeFormValues([
    [
      {
        value: 'quick_start',
        total: totalEvents(points, 'lead_quick_start_submitted'),
      },
      {
        value: 'platform_audit',
        total: totalEvents(points, 'lead_audit_submitted'),
      },
    ].filter((item) => item.total > 0),
    read<PropertyValue[]>('legacy-form-values', []),
  ]);
  const industryValues = mergeValues([
    read<PropertyValue[]>('industry-values', []),
    read<PropertyValue[]>('legacy-industry-values', []),
  ]);
  const projectTypeValues = read<PropertyValue[]>('project-type-values', []);
  const budgetValues = read<PropertyValue[]>('budget-values', []);
  const timelineValues = read<PropertyValue[]>('timeline-values', []);
  const conversionSources = mergeValues([
    read<PropertyValue[]>('conversion-sources', []),
    read<PropertyValue[]>('legacy-conversion-sources', []),
  ]);
  const currentPageQuality = read<ExpandedMetric[]>('page-quality', []).filter((item) =>
    isCurrentPublicPath(item.name),
  );
  const currentEntryPages = read<MetricPoint[]>('entry-pages', []).filter((item) =>
    isCurrentPublicPath(item.x),
  );
  const currentExitPages = read<MetricPoint[]>('exit-pages', []).filter((item) =>
    isCurrentPublicPath(item.x),
  );
  const activeVisitors = read<{ visitors: number }>('active-visitors', {
    visitors: 0,
  }).visitors;
  const realtime = read<RealtimeResponse>('realtime', {});
  const dateRange: DateRange = {
    key: dateRangeKey,
    label: `Last ${rangeDays[dateRangeKey]} days`,
    from: new Date(startAt).toISOString(),
    to: new Date(endAt).toISOString(),
  };

  return {
    dateRange,
    metrics: [
      metric(
        'pageviews',
        'Page views',
        stats.pageviews,
        stats.pageviews,
        comparison.pageviews,
        'All native page-view events',
      ),
      metric(
        'visitors',
        'Visitors',
        stats.visitors,
        stats.visitors,
        comparison.visitors,
        'Privacy-safe unique sessions',
      ),
      metric(
        'visits',
        'Visits',
        stats.visits,
        stats.visits,
        comparison.visits,
        'Hourly return sessions',
      ),
      metric(
        'conversion_rate',
        'Visitor conversion',
        `${conversionRate}%`,
        conversionRate,
        previousConversionRate,
        'Visitor to submitted form',
      ),
      metric(
        'bounce_rate',
        'Bounce rate',
        `${bounceRate}%`,
        bounceRate,
        previousBounceRate,
        'One-event visits',
        true,
      ),
      metric(
        'average_visit_time',
        'Average visit',
        `${averageVisitSeconds}s`,
        averageVisitSeconds,
        previousAverageVisitSeconds,
        'Engaged time per visit',
      ),
      metric(
        'lead_submitted',
        'Forms submitted',
        submissions,
        submissions,
        previousSubmissions,
        'Validated completion events',
      ),
      metric(
        'schedule_clicked',
        'Book-call intent',
        totalEventGroup(points, allScheduleEventNames),
        totalEventGroup(points, allScheduleEventNames),
        totalEventGroup(previousPoints, allScheduleEventNames),
        'Scheduling clicks',
      ),
    ],
    funnel: orderedFunnel(orderedFunnelReport, points, previousPoints),
    activeVisitors,
    dailyPageViews,
    dailyVisitors,
    dailyVisits: [],
    dailyFormStarts,
    dailySubmissions,
    dailyScheduleClicks: fillDailySeries(
      points,
      startAt,
      endAt,
      'Book-call clicks',
      allScheduleEventNames,
    ),
    dailyConversionRate: conversionSeries(dailyVisitors, dailySubmissions),
    ctaClicksBySource: toSummary(conversionSources, 'Conversion interactions'),
    eventVolume: umamiEventNames
      .map((eventName) => ({
        key: eventName,
        label: eventLabels[eventName],
        value: totalEvents(points, eventName),
        context: 'Tracked events',
      }))
      .filter((item) => item.value > 0),
    formPerformance: toSummary(formValues, 'Submitted forms'),
    industryPerformance: toSummary(industryValues, 'Submitted forms'),
    deviceCategories: toSummary(read<MetricPoint[]>('devices', []), 'Visitors by device'),
    submissionsByProjectType: toSummary(projectTypeValues, 'Submitted forms'),
    submissionsByIndustry: toSummary(industryValues, 'Submitted forms'),
    submissionsByBudget: toSummary(budgetValues, 'Submitted forms'),
    submissionsByTimeline: toSummary(timelineValues, 'Submitted forms'),
    topLandingPages: toSummary(
      currentPageQuality.map((item) => ({
        name: item.name,
        total: item.pageviews,
      })),
      'Native page views',
    ),
    entryPages: toSummary(currentEntryPages, 'Visit entry pages'),
    exitPages: toSummary(currentExitPages, 'Visit exit pages'),
    pageQuality: pageQuality(currentPageQuality),
    topReferrers: toSummary(
      attribution.referrer?.length
        ? attribution.referrer
        : read<MetricPoint[]>('referrers', []),
      'Visits by referrer',
    ),
    channels: toSummary(read<MetricPoint[]>('channels', []), 'Visits by channel'),
    countries: toSummary(read<MetricPoint[]>('countries', []), 'Visitors by country'),
    regions: toSummary(read<MetricPoint[]>('regions', []), 'Visitors by region'),
    cities: toSummary(read<MetricPoint[]>('cities', []), 'Visitors by city'),
    browsers: toSummary(read<MetricPoint[]>('browsers', []), 'Visitors by browser'),
    operatingSystems: toSummary(
      read<MetricPoint[]>('operating-systems', []),
      'Visitors by operating system',
    ),
    screens: toSummary(read<MetricPoint[]>('screens', []), 'Visitors by screen'),
    languages: toSummary(read<MetricPoint[]>('languages', []), 'Visitors by language'),
    utmCampaignPerformance: toSummary(
      attribution.utm_campaign?.length
        ? attribution.utm_campaign
        : (utm.utm_campaign ?? []),
      'Attributed visits',
    ),
    utmSources: toSummary(
      attribution.utm_source?.length ? attribution.utm_source : (utm.utm_source ?? []),
      'Attributed visits',
    ),
    utmMediums: toSummary(
      attribution.utm_medium?.length ? attribution.utm_medium : (utm.utm_medium ?? []),
      'Attributed visits',
    ),
    utmContent: toSummary(utm.utm_content ?? [], 'Attributed visits'),
    utmTerms: toSummary(utm.utm_term ?? [], 'Attributed visits'),
    paidAdSources: toSummary(attribution.paidAds ?? [], 'Attributed conversions'),
    weeklyActivity: weeklyActivity(read<number[][]>('weekly-activity', [])),
    webVitals: webVitals(read<PerformanceReport>('performance', {})),
    realtime: realtimeSummary(realtime, activeVisitors),
    availability: signalAvailability(signals),
    source: 'umami',
  };
}
