import { describe, expect, it } from 'vitest';

import { escapeCsvValue } from './csv';

describe('CSV export safety', () => {
  it.each(['=1+1', '+cmd', '-2+3', '@SUM(A:A)', '  =HYPERLINK("x")'])(
    'neutralizes spreadsheet formula input %s',
    (value) => {
      expect(escapeCsvValue(value)).toContain("'");
    },
  );

  it('escapes quotes, commas, and newlines', () => {
    expect(escapeCsvValue('Luxa, "Studio"\nLead')).toBe('"Luxa, ""Studio""\nLead"');
  });

  it('leaves ordinary values readable', () => {
    expect(escapeCsvValue('Luxa Studio')).toBe('Luxa Studio');
  });
});
