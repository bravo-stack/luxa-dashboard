import { describe, expect, it } from 'vitest';

import { compareTrend, conversionSeries, fillDailySeries, percentageRate } from './math';

describe('analytics math', () => {
  it('calculates stable percentage rates without dividing by zero', () => {
    expect(percentageRate(3, 12)).toBe(25);
    expect(percentageRate(1, 3)).toBe(33.3);
    expect(percentageRate(4, 0)).toBe(0);
  });

  it('compares current and previous ranges', () => {
    expect(compareTrend(15, 10)).toEqual({ label: '+50%', direction: 'up' });
    expect(compareTrend(5, 10)).toEqual({ label: '-50%', direction: 'down' });
    expect(compareTrend(2, 0)).toEqual({ label: 'New', direction: 'up' });
    expect(compareTrend(0, 0)).toEqual({
      label: 'No change',
      direction: 'flat',
    });
  });

  it('fills missing UTC days and aggregates duplicate event points', () => {
    const startAt = Date.parse('2026-07-01T08:00:00.000Z');
    const endAt = Date.parse('2026-07-03T08:00:00.000Z');
    const result = fillDailySeries(
      [
        { x: 'submitted', t: '2026-07-01T00:00:00.000Z', y: 2 },
        { x: 'submitted', t: '2026-07-01T12:00:00.000Z', y: 3 },
        { x: 'other', t: '2026-07-02T00:00:00.000Z', y: 99 },
      ],
      startAt,
      endAt,
      'Submissions',
      'submitted',
    );

    expect(result.map((point) => point.value)).toEqual([5, 0, 0]);
    expect(result.map((point) => point.key)).toEqual([
      '2026-07-01',
      '2026-07-02',
      '2026-07-03',
    ]);
  });

  it('combines related event names into one daily series', () => {
    const startAt = Date.parse('2026-07-01T00:00:00.000Z');
    const endAt = Date.parse('2026-07-01T23:59:59.000Z');
    const result = fillDailySeries(
      [
        { x: 'quick_start', t: '2026-07-01T02:00:00.000Z', y: 2 },
        { x: 'audit', t: '2026-07-01T04:00:00.000Z', y: 3 },
        { x: 'unrelated', t: '2026-07-01T06:00:00.000Z', y: 10 },
      ],
      startAt,
      endAt,
      'Submissions',
      ['quick_start', 'audit'],
    );

    expect(result.map((point) => point.value)).toEqual([5]);
  });

  it('aligns conversions by date key instead of array position', () => {
    const audience = [
      { key: 'a', label: 'A', value: 20, context: 'Visitors' },
      { key: 'b', label: 'B', value: 10, context: 'Visitors' },
    ];
    const conversions = [
      { key: 'b', label: 'B', value: 2, context: 'Submissions' },
      { key: 'a', label: 'A', value: 1, context: 'Submissions' },
    ];

    expect(conversionSeries(audience, conversions).map((point) => point.value)).toEqual([
      5, 20,
    ]);
  });
});
