import { describe, expect, it } from 'vitest';

import {
  isCurrentPublicPath,
  legacyAuditFunnelSteps,
  normalizePublicPath,
  primaryAuditFunnelSteps,
  publicSiteEventNames,
} from './public-site';

describe('public site analytics model', () => {
  it('normalizes tracked URLs before route classification', () => {
    expect(
      normalizePublicPath('https://www.luxasolution.com/audit?utm_source=test'),
    ).toBe('/audit');
    expect(normalizePublicPath('/pricing/')).toBe('/pricing');
    expect(normalizePublicPath('not-a-path')).toBeNull();
  });

  it('includes the current static and dynamic public routes', () => {
    expect(isCurrentPublicPath('/')).toBe(true);
    expect(isCurrentPublicPath('/audit')).toBe(true);
    expect(isCurrentPublicPath('/case-studies/platform-redesign')).toBe(true);
    expect(isCurrentPublicPath('/industries/professional-services')).toBe(true);
  });

  it('excludes retired, redirect-only, and private routes', () => {
    expect(isCurrentPublicPath('/solutions/dashboards')).toBe(false);
    expect(isCurrentPublicPath('/contact')).toBe(false);
    expect(isCurrentPublicPath('/dashboard')).toBe(false);
    expect(isCurrentPublicPath('/case-studies/example/screenshots')).toBe(false);
  });

  it('keeps the primary funnel and event contract aligned with the current site', () => {
    expect(primaryAuditFunnelSteps).toEqual([
      { type: 'path', value: '/audit' },
      { type: 'event', value: 'lead_audit_started' },
      { type: 'event', value: 'lead_audit_submitted' },
    ]);
    expect(legacyAuditFunnelSteps[0]).toEqual({ type: 'path', value: '/audit' });
    expect(publicSiteEventNames).toContain('lead_quick_start_submitted');
    expect(publicSiteEventNames).toContain('schedule_clicked');
    expect(publicSiteEventNames).not.toContain('lead_form_submitted');
  });
});
