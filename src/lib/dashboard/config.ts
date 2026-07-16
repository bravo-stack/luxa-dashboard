import type { DateRange, DateRangeKey } from './types';

const rangeDays: Record<DateRangeKey, number> = {
  '7d': 7,
  '14d': 14,
  '30d': 30,
  '90d': 90,
};

export function getDashboardDateRange(key: DateRangeKey): DateRange {
  const to = new Date();
  const from = new Date(to.getTime() - rangeDays[key] * 24 * 60 * 60 * 1000);

  return {
    key,
    label: `Last ${rangeDays[key]} days`,
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

export const dashboardDateRanges = (Object.keys(rangeDays) as DateRangeKey[]).map(
  getDashboardDateRange,
);

export const defaultDashboardDateRange = getDashboardDateRange('7d');
