import type { SourceSummary, TrendDirection } from '@/lib/dashboard/types';

type SeriesPoint = {
  x?: string;
  t?: string;
  y: number;
};

export function percentageRate(numerator: number, denominator: number, precision = 1) {
  return denominator > 0
    ? Number(((numerator / denominator) * 100).toFixed(precision))
    : 0;
}

export function compareTrend(current: number, previous: number) {
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

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export function fillDailySeries(
  points: SeriesPoint[],
  startAt: number,
  endAt: number,
  context: string,
  seriesName?: string,
): SourceSummary[] {
  const totals = new Map<string, number>();

  for (const point of points) {
    if (!seriesName || point.x === seriesName) {
      const timestamp = point.t ?? point.x;

      if (timestamp) {
        const key = timestamp.slice(0, 10);
        totals.set(key, (totals.get(key) ?? 0) + point.y);
      }
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

export function conversionSeries(
  audience: SourceSummary[],
  conversions: SourceSummary[],
): SourceSummary[] {
  const conversionsByKey = new Map(
    conversions.map((conversion) => [conversion.key, conversion.value]),
  );

  return audience.map((item) => ({
    key: item.key,
    label: item.label,
    value: percentageRate(conversionsByKey.get(item.key) ?? 0, item.value),
    context: 'Submission conversion',
  }));
}
