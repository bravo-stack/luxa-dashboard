import { describe, expect, it } from 'vitest';

import { isAnalyticsEventName, sanitizeAnalyticsProperties } from './events';

describe('analytics privacy contract', () => {
  it('drops properties outside the controlled allowlist', () => {
    expect(
      sanitizeAnalyticsProperties({
        path: '/contact',
        source: 'hero',
        email: 'private@example.com',
        full_name: 'Private Person',
      }),
    ).toEqual({
      path: '/contact',
      source: 'hero',
    });
  });

  it('rejects arbitrary event names', () => {
    expect(isAnalyticsEventName('lead_audit_submitted')).toBe(true);
    expect(isAnalyticsEventName('email_address_captured')).toBe(false);
  });
});
