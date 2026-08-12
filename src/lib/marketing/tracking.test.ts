import { describe, expect, it } from 'vitest';

import {
  campaignChannelPresets,
  isTrackingValue,
  publicCampaignUrl,
  toTrackingSlug,
} from './tracking';

describe('campaign tracking values', () => {
  it('normalizes names into stable lowercase slugs', () => {
    expect(toTrackingSlug(' Q4 Platform Audit — Education ')).toBe(
      'q4-platform-audit-education',
    );
  });

  it('rejects fragmented or unsafe values', () => {
    expect(isTrackingValue('linkedin', 100)).toBe(true);
    expect(isTrackingValue('paid_social', 100)).toBe(true);
    expect(isTrackingValue('Paid Social', 100)).toBe(false);
    expect(isTrackingValue('https://example.com', 100)).toBe(false);
  });

  it('keeps channel presets deterministic', () => {
    expect(campaignChannelPresets.google_ads).toMatchObject({
      source: 'google',
      medium: 'cpc',
    });
    expect(campaignChannelPresets.partner.configurableSource).toBe(true);
  });

  it('creates the canonical public short URL', () => {
    expect(publicCampaignUrl('abcdef123456')).toBe(
      'https://www.luxasolution.com/go/abcdef123456',
    );
  });
});
