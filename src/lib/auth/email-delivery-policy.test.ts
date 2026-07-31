import { describe, expect, it } from 'vitest';

import {
  AUTH_EMAIL_CONFIGURATION_FLAG,
  resolveAuthEmailDeliveryReadiness,
} from './email-delivery-policy';

describe('authentication email delivery policy', () => {
  it('allows local development without a production attestation', () => {
    expect(
      resolveAuthEmailDeliveryReadiness({
        nodeEnv: 'development',
      }),
    ).toEqual({ ready: true, label: 'Development' });
  });

  it('fails closed on production and Vercel until provider settings are verified', () => {
    expect(
      resolveAuthEmailDeliveryReadiness({
        nodeEnv: 'production',
      }),
    ).toEqual({ ready: false, label: 'Manual verification required' });
    expect(
      resolveAuthEmailDeliveryReadiness({
        nodeEnv: 'development',
        vercel: '1',
        vercelEnv: 'preview',
      }),
    ).toEqual({ ready: false, label: 'Manual verification required' });
  });

  it('accepts only an explicit true attestation', () => {
    expect(
      resolveAuthEmailDeliveryReadiness({
        nodeEnv: 'production',
        configurationVerified: 'TRUE',
      }),
    ).toEqual({ ready: true, label: 'Verified' });
    expect(
      resolveAuthEmailDeliveryReadiness({
        nodeEnv: 'production',
        configurationVerified: 'yes',
      }).ready,
    ).toBe(false);
    expect(AUTH_EMAIL_CONFIGURATION_FLAG).toBe('SUPABASE_AUTH_EMAILS_VERIFIED');
  });
});
