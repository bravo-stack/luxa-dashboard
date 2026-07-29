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
  throw new Error(
    'Configure NEXT_PUBLIC_UMAMI_WEBSITE_ID, UMAMI_API_URL (or host), and an API key/token',
  );
}

const headers = {
  Accept: 'application/json',
  ...(apiKey ? { 'x-umami-api-key': apiKey } : { Authorization: `Bearer ${token}` }),
};
const endAt = Date.now();
const startAt = endAt - 30 * 24 * 60 * 60 * 1000;
const range = new URLSearchParams({
  startAt: String(startAt),
  endAt: String(endAt),
  unit: 'day',
  timezone: 'UTC',
});

function describe(value, depth = 0) {
  if (Array.isArray(value)) {
    return {
      type: 'array',
      count: value.length,
      itemKeys:
        value[0] && typeof value[0] === 'object' ? Object.keys(value[0]).sort() : [],
      ...(depth < 1 && value[0] ? { item: describe(value[0], depth + 1) } : {}),
    };
  }

  if (value && typeof value === 'object') {
    return {
      type: 'object',
      keys: Object.keys(value).sort(),
      ...(depth < 1
        ? {
            fields: Object.fromEntries(
              Object.entries(value).map(([key, item]) => [
                key,
                describe(item, depth + 1),
              ]),
            ),
          }
        : {}),
      collections: Object.fromEntries(
        Object.entries(value)
          .filter(([, item]) => Array.isArray(item))
          .map(([key, item]) => [key, item.length]),
      ),
    };
  }

  return { type: typeof value };
}

async function request(name, path, body) {
  try {
    const response = await fetch(`${apiUrl}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: body ? { ...headers, 'Content-Type': 'application/json' } : headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(12_000),
    });
    const value = await response.json().catch(() => null);

    return {
      name,
      ok: response.ok,
      status: response.status,
      ...(response.ok ? describe(value) : {}),
      ...(response.ok && name === 'events-series' && Array.isArray(value)
        ? {
            eventNames: Array.from(
              new Set(
                value
                  .map((item) => (typeof item?.x === 'string' ? item.x : null))
                  .filter(Boolean),
              ),
            ).sort(),
          }
        : {}),
    };
  } catch (error) {
    return {
      name,
      ok: false,
      status: 0,
      error: error instanceof Error ? error.name : 'UnknownError',
    };
  }
}

const reportBase = {
  websiteId,
  filters: {},
};
const reportParameters = {
  startDate: new Date(startAt).toISOString(),
  endDate: new Date(endAt).toISOString(),
  timezone: 'UTC',
};

const checks = await Promise.all([
  request('stats', `/websites/${websiteId}/stats?${range}&compare=prev`),
  request('pageviews', `/websites/${websiteId}/pageviews?${range}&compare=prev`),
  request('active', `/websites/${websiteId}/active`),
  request('realtime', `/realtime/${websiteId}`),
  request('events-series', `/websites/${websiteId}/events/series?${range}`),
  request('events-stats', `/websites/${websiteId}/events/stats?${range}`),
  request('paths-expanded', `/websites/${websiteId}/metrics/expanded?${range}&type=path`),
  request('entry-pages', `/websites/${websiteId}/metrics?${range}&type=entry`),
  request('exit-pages', `/websites/${websiteId}/metrics?${range}&type=exit`),
  request('channels', `/websites/${websiteId}/metrics?${range}&type=channel`),
  request('devices', `/websites/${websiteId}/metrics?${range}&type=device`),
  request('countries', `/websites/${websiteId}/metrics?${range}&type=country`),
  request('weekly', `/websites/${websiteId}/sessions/weekly?${range}`),
  request('session-stats', `/websites/${websiteId}/sessions/stats?${range}`),
  request('event-properties', `/websites/${websiteId}/event-data/fields?${range}`),
  request(
    'form-values',
    `/websites/${websiteId}/event-data/values?${range}&event=lead_form_submitted&propertyName=form`,
  ),
  request(
    'placement-values',
    `/websites/${websiteId}/event-data/values?${range}&event=book_call_clicked&propertyName=placement`,
  ),
  request('performance-report', '/reports/performance', {
    ...reportBase,
    type: 'performance',
    parameters: reportParameters,
  }),
  request('funnel-report', '/reports/funnel', {
    ...reportBase,
    type: 'funnel',
    parameters: {
      ...reportParameters,
      steps: [
        { type: 'event', value: 'lead_form_started' },
        { type: 'event', value: 'lead_form_submitted' },
        { type: 'event', value: 'book_call_clicked' },
      ],
      window: 30,
    },
  }),
  request('attribution-report', '/reports/attribution', {
    ...reportBase,
    type: 'attribution',
    parameters: {
      ...reportParameters,
      model: 'first-click',
      type: 'event',
      step: 'lead_form_submitted',
    },
  }),
  request('utm-report', '/reports/utm', {
    ...reportBase,
    type: 'utm',
    parameters: reportParameters,
  }),
]);

console.log(
  JSON.stringify(
    {
      ok: checks.some((check) => check.ok),
      websiteConfigured: true,
      checks,
    },
    null,
    2,
  ),
);
