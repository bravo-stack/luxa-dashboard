import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PRODUCTION_ORIGIN,
  INVITE_EMAIL_CALLBACK_URL,
  RECOVERY_EMAIL_CALLBACK_URL,
  resolveApplicationOrigin,
} from './origin-policy';

describe('authentication email origin policy', () => {
  it('pins production callbacks even when every configured URL points to localhost', () => {
    expect(
      resolveApplicationOrigin({
        nodeEnv: 'production',
        authEmailCallbackOrigin: 'http://localhost:3000',
        nextPublicAppUrl: 'http://127.0.0.1:3000',
        appUrl: 'http://localhost:4000',
        vercelProjectProductionUrl: 'preview.example.com',
      }),
    ).toBe(DEFAULT_PRODUCTION_ORIGIN);
  });

  it('does not let a preview or unrelated host replace the production callback', () => {
    expect(
      resolveApplicationOrigin({
        nodeEnv: 'production',
        authEmailCallbackOrigin: 'https://preview.example.com',
      }),
    ).toBe(DEFAULT_PRODUCTION_ORIGIN);
  });

  it('pins Vercel production even if NODE_ENV was incorrectly overridden', () => {
    expect(
      resolveApplicationOrigin({
        nodeEnv: 'development',
        vercel: '1',
        vercelEnv: 'production',
        authEmailCallbackOrigin: 'http://localhost:3000',
      }),
    ).toBe(DEFAULT_PRODUCTION_ORIGIN);
  });

  it('uses literal production URLs for every outbound authentication email', () => {
    expect(INVITE_EMAIL_CALLBACK_URL).toBe(
      'https://luxa-dashboard.vercel.app/auth/email-callback?mode=invite',
    );
    expect(RECOVERY_EMAIL_CALLBACK_URL).toBe(
      'https://luxa-dashboard.vercel.app/auth/email-callback?mode=recovery',
    );
    expect(INVITE_EMAIL_CALLBACK_URL).not.toContain('localhost');
    expect(RECOVERY_EMAIL_CALLBACK_URL).not.toContain('localhost');
  });

  it('allows localhost during local development', () => {
    expect(
      resolveApplicationOrigin({
        nodeEnv: 'development',
        authEmailCallbackOrigin: 'http://localhost:3100/invite',
      }),
    ).toBe('http://localhost:3100');
  });

  it('ignores insecure remote origins outside production', () => {
    expect(
      resolveApplicationOrigin({
        nodeEnv: 'test',
        authEmailCallbackOrigin: 'http://example.com',
        nextPublicAppUrl: 'https://staging.example.com/path',
      }),
    ).toBe('https://staging.example.com');
  });
});
