import 'server-only';

import type {
  AnalyticsSummary,
  DateRange,
  DateRangeKey,
  FunnelStepSummary,
  MetricSummary,
  SourceSummary,
  TrendDirection,
} from '@/lib/dashboard/types';

const eventNames = [
  'page_viewed',
  'lead_form_started',
  'lead_form_step_completed',
  'lead_form_submitted',
  'book_call_clicked',
  'email_clicked',
  'pricing_cta_clicked',
  'case_study_clicked',
  'lead_form_validation_failed',
  'lead_form_step_back',
  'lead_form_abandoned',
  'language_changed',
  'theme_changed',
] as const;

type EventName = (typeof eventNames)[number];

type EventSeriesPoint = {
  x: string;
  t: string;
  y: number;
};

type PropertyValue = {
  value: string;
  total: number;
};

type UmamiConfig = {
  apiUrl: string;
  websiteId: string;
  headers: HeadersInit;
};

const rangeDays: Record<DateRangeKey, number> = {
  '7d': 7,
  '14d': 14,
  '30d': 30,
  '90d': 90,
};

const eventLabels: Record<EventName, string> = {
  page_viewed: 'Page views',
  lead_form_started: 'Form starts',
  lead_form_step_completed: 'Steps completed',
  lead_form_submitted: 'Forms submitted',
  book_call_clicked: 'Book-call clicks',
  email_clicked: 'Email clicks',
  pricing_cta_clicked: 'Pricing CTA clicks',
  case_study_clicked: 'Case study clicks',
  lead_form_validation_failed: 'Validation blocks',
  lead_form_step_back: 'Step backs',
  lead_form_abandoned: 'Form abandons',
  language_changed: 'Language changes',
  theme_changed: 'Theme changes',
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
  const startAt = endAt - rangeDays[key] * 24 * 60 * 60 * 1000;
  const previousStartAt = startAt - rangeDays[key] * 24 * 60 * 60 * 1000;

  return { startAt, endAt, previousStartAt };
}

async function getJson<T>(config: UmamiConfig, path: string): Promise<T> {
  const response = await fetch(`${config.apiUrl}${path}`, {
    headers: config.headers,
    cache: 'no-store',
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    throw new Error(`Umami request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

function unwrapArray<T>(value: T[] | { data?: T[] }): T[] {
  return Array.isArray(value) ? value : (value.data ?? []);
}

async function getEventSeries(config: UmamiConfig, startAt: number, endAt: number) {
  const params = new URLSearchParams({
    startAt: String(startAt),
    endAt: String(endAt),
    unit: 'day',
    timezone: 'UTC',
  });
  const result = await getJson<EventSeriesPoint[] | { data?: EventSeriesPoint[] }>(
    config,
    `/websites/${config.websiteId}/events/series?${params}`,
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
  eventName: EventName,
  propertyName: string,
) {
  const params = new URLSearchParams({
    startAt: String(startAt),
    endAt: String(endAt),
    eventName,
    propertyName,
  });
  const result = await getJson<PropertyValue[] | { data?: PropertyValue[] }>(
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

function totalEvents(points: EventSeriesPoint[], eventName: EventName) {
  return points
    .filter((point) => point.x === eventName)
    .reduce((total, point) => total + point.y, 0);
}

function trend(current: number, previous: number) {
  if (current === previous) {
    return { label: 'No change', direction: 'flat' as TrendDirection };
  }

  if (previous === 0) {
    return { label: 'New', direction: 'up' as TrendDirection };
  }

  const percentage = Math.round(((current - previous) / previous) * 100);

  return {
    label: `${percentage > 0 ? '+' : ''}${percentage}%`,
    direction: percentage > 0 ? ('up' as const) : ('down' as const),
  };
}

function metric(
  key: EventName,
  label: string,
  note: string,
  currentPoints: EventSeriesPoint[],
  previousPoints: EventSeriesPoint[],
): MetricSummary {
  const value = totalEvents(currentPoints, key);
  const change = trend(value, totalEvents(previousPoints, key));

  return {
    key,
    label,
    value,
    trend: change.label,
    trendDirection: change.direction,
    note,
  };
}

function toDateKey(value: string) {
  return value.slice(0, 10);
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function dailySeries(
  points: EventSeriesPoint[],
  eventName: EventName,
  startAt: number,
  endAt: number,
  context: string,
): SourceSummary[] {
  const totals = new Map<string, number>();

  for (const point of points) {
    if (point.x === eventName) {
      const key = toDateKey(point.t);
      totals.set(key, (totals.get(key) ?? 0) + point.y);
    }
  }

  const result: SourceSummary[] = [];
  const cursor = new Date(startAt);
  cursor.setUTCHours(0, 0, 0, 0);
  const last = new Date(endAt);
  last.setUTCHours(0, 0, 0, 0);

  while (cursor <= last) {
    const key = cursor.toISOString().slice(0, 10);
    result.push({
      key,
      label: formatDateLabel(key),
      value: totals.get(key) ?? 0,
      context,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return result;
}

function conversionSeries(
  views: SourceSummary[],
  submissions: SourceSummary[],
): SourceSummary[] {
  return views.map((view, index) => ({
    key: view.key,
    label: view.label,
    value:
      view.value > 0
        ? Number((((submissions[index]?.value ?? 0) / view.value) * 100).toFixed(1))
        : 0,
    context: 'Page view to submission',
  }));
}

function labelValue(value: string) {
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

function toSummary(values: PropertyValue[], context: string, limit = 6): SourceSummary[] {
  return values
    .slice()
    .sort((first, second) => second.total - first.total)
    .slice(0, limit)
    .map((item) => ({
      key: item.value,
      label: labelValue(item.value),
      value: item.total,
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

function funnelStep(
  eventName: EventName,
  points: EventSeriesPoint[],
  previousPoints: EventSeriesPoint[],
  pageViews: number,
): FunnelStepSummary {
  const value = totalEvents(points, eventName);

  return {
    key: eventName,
    label: eventLabels[eventName],
    value,
    rate: pageViews > 0 ? Number(((value / pageViews) * 100).toFixed(1)) : 0,
    delta: trend(value, totalEvents(previousPoints, eventName)).label,
  };
}

function settledValue<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === 'fulfilled' ? result.value : fallback;
}

export async function getUmamiAnalytics(
  dateRangeKey: DateRangeKey,
): Promise<AnalyticsSummary | null> {
  const config = getConfig();

  if (!config) {
    return null;
  }

  const { startAt, endAt, previousStartAt } = getDateRange(dateRangeKey);

  try {
    const [points, previousPoints] = await Promise.all([
      getEventSeries(config, startAt, endAt),
      getEventSeries(config, previousStartAt, startAt),
    ]);

    const propertyResults = await Promise.allSettled([
      getPropertyValues(config, startAt, endAt, 'page_viewed', 'pathname'),
      getPropertyValues(config, startAt, endAt, 'page_viewed', 'referrer'),
      getPropertyValues(config, startAt, endAt, 'page_viewed', 'utm_campaign'),
      getPropertyValues(config, startAt, endAt, 'page_viewed', 'device_category'),
      getPropertyValues(config, startAt, endAt, 'lead_form_submitted', 'form'),
      getPropertyValues(config, startAt, endAt, 'lead_form_submitted', 'industry'),
      getPropertyValues(config, startAt, endAt, 'book_call_clicked', 'placement'),
      getPropertyValues(config, startAt, endAt, 'email_clicked', 'placement'),
      getPropertyValues(config, startAt, endAt, 'pricing_cta_clicked', 'placement'),
      getPropertyValues(config, startAt, endAt, 'case_study_clicked', 'placement'),
    ]);
    const propertyValues = propertyResults.map((result) => settledValue(result, []));
    const paths = propertyValues[0] ?? [];
    const referrers = propertyValues[1] ?? [];
    const campaigns = propertyValues[2] ?? [];
    const devices = propertyValues[3] ?? [];
    const forms = propertyValues[4] ?? [];
    const industries = propertyValues[5] ?? [];
    const bookPlacements = propertyValues[6] ?? [];
    const emailPlacements = propertyValues[7] ?? [];
    const pricingPlacements = propertyValues[8] ?? [];
    const caseStudyPlacements = propertyValues[9] ?? [];
    const pageViews = totalEvents(points, 'page_viewed');
    const dailyPageViews = dailySeries(
      points,
      'page_viewed',
      startAt,
      endAt,
      'Tracked page views',
    );
    const dailySubmissions = dailySeries(
      points,
      'lead_form_submitted',
      startAt,
      endAt,
      'Validated form submissions',
    );
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
          'page_viewed',
          'Page views',
          'Tracked App Router paths',
          points,
          previousPoints,
        ),
        metric(
          'lead_form_started',
          'Form starts',
          'First form interaction',
          points,
          previousPoints,
        ),
        metric(
          'lead_form_step_completed',
          'Steps completed',
          'Valid advances',
          points,
          previousPoints,
        ),
        metric(
          'lead_form_submitted',
          'Forms submitted',
          'Frontend success states',
          points,
          previousPoints,
        ),
        metric(
          'book_call_clicked',
          'Book-call clicks',
          'Scheduling intent',
          points,
          previousPoints,
        ),
        metric(
          'email_clicked',
          'Email clicks',
          'Direct contact intent',
          points,
          previousPoints,
        ),
      ],
      funnel: [
        funnelStep('page_viewed', points, previousPoints, pageViews),
        funnelStep('lead_form_started', points, previousPoints, pageViews),
        funnelStep('lead_form_submitted', points, previousPoints, pageViews),
        funnelStep('book_call_clicked', points, previousPoints, pageViews),
      ],
      dailyVisitors: dailyPageViews,
      dailyFormStarts: dailySeries(
        points,
        'lead_form_started',
        startAt,
        endAt,
        'First form interactions',
      ),
      dailySubmissions,
      dailyScheduleClicks: dailySeries(
        points,
        'book_call_clicked',
        startAt,
        endAt,
        'Book-call clicks',
      ),
      dailyConversionRate: conversionSeries(dailyPageViews, dailySubmissions),
      ctaClicksBySource: toSummary(
        mergeValues([
          bookPlacements,
          emailPlacements,
          pricingPlacements,
          caseStudyPlacements,
        ]),
        'Conversion interactions',
      ),
      eventVolume: eventNames
        .map((eventName) => ({
          key: eventName,
          label: eventLabels[eventName],
          value: totalEvents(points, eventName),
          context: 'Tracked events',
        }))
        .filter((item) => item.value > 0),
      formPerformance: toSummary(forms, 'Submitted forms'),
      industryPerformance: toSummary(industries, 'Submitted forms'),
      deviceCategories: toSummary(devices, 'Page views'),
      submissionsByProjectType: [],
      submissionsByIndustry: toSummary(industries, 'Submitted forms'),
      submissionsByBudget: [],
      submissionsByTimeline: [],
      topLandingPages: toSummary(paths, 'Page views'),
      topReferrers: toSummary(referrers, 'Page views'),
      utmCampaignPerformance: toSummary(campaigns, 'Page views'),
      source: 'umami',
    };
  } catch {
    return null;
  }
}
