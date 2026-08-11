import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  isSameOriginRequest: vi.fn(),
  parseEmailConfirmation: vi.fn(),
  verifyOtp: vi.fn(),
}));

vi.mock('@/lib/auth/email-confirmation', () => ({
  parseEmailConfirmation: mocks.parseEmailConfirmation,
}));

vi.mock('@/lib/auth/origin', () => ({
  getApplicationOrigin: () => 'https://luxa-dashboard.vercel.app',
}));

vi.mock('@/lib/auth/same-origin', () => ({
  isSameOriginRequest: mocks.isSameOriginRequest,
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));

import { POST } from './route';

const applicationOrigin = 'https://luxa-dashboard.vercel.app';

function confirmationRequest(
  values: Record<string, string> = {
    token_hash: 'valid-token-hash',
    type: 'invite',
  },
  origin: string | null = applicationOrigin,
) {
  const headers = new Headers({
    'content-type': 'application/x-www-form-urlencoded',
  });

  if (origin) headers.set('origin', origin);

  return new Request(`${applicationOrigin}/auth/confirm/complete`, {
    method: 'POST',
    headers,
    body: new URLSearchParams(values),
  });
}

describe('email confirmation completion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createSupabaseServerClient.mockResolvedValue({
      auth: { verifyOtp: mocks.verifyOtp },
    });
    mocks.isSameOriginRequest.mockImplementation(
      (requestUrl: string, origin: string | null) => {
        if (!origin) return false;

        try {
          return new URL(requestUrl).origin === new URL(origin).origin;
        } catch {
          return false;
        }
      },
    );
    mocks.parseEmailConfirmation.mockImplementation(
      (tokenHash: unknown, type: unknown) =>
        typeof tokenHash === 'string' &&
        tokenHash.length > 0 &&
        (type === 'invite' || type === 'recovery')
          ? { tokenHash, type }
          : null,
    );
    mocks.verifyOtp.mockResolvedValue({ error: null });
  });

  it('verifies the token only after a same-origin form submission', async () => {
    const response = await POST(confirmationRequest());

    expect(mocks.verifyOtp).toHaveBeenCalledWith({
      token_hash: 'valid-token-hash',
      type: 'invite',
    });
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(
      `${applicationOrigin}/set-password?mode=invite`,
    );
  });

  it('accepts a valid form submission when an email-app browser omits Origin', async () => {
    const response = await POST(confirmationRequest(undefined, null));

    expect(mocks.verifyOtp).toHaveBeenCalledWith({
      token_hash: 'valid-token-hash',
      type: 'invite',
    });
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(
      `${applicationOrigin}/set-password?mode=invite`,
    );
  });

  it.each(['https://attacker.example', 'null', 'not-an-origin'])(
    'rejects an explicitly untrusted origin %s',
    async (origin) => {
      const response = await POST(confirmationRequest(undefined, origin));

      expect(response.status).toBe(403);
      expect(mocks.verifyOtp).not.toHaveBeenCalled();
    },
  );

  it('redirects malformed confirmation data without verifying it', async () => {
    const response = await POST(
      confirmationRequest({ token_hash: 'valid-token-hash', type: 'signup' }),
    );

    expect(mocks.verifyOtp).not.toHaveBeenCalled();
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(`${applicationOrigin}/?auth=expired`);
  });

  it('redirects an expired or previously used token', async () => {
    mocks.verifyOtp.mockResolvedValue({ error: new Error('Token expired') });

    const response = await POST(
      confirmationRequest({ token_hash: 'valid-token-hash', type: 'recovery' }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(`${applicationOrigin}/?auth=expired`);
  });

  it('handles an unreadable form body without exposing an error', async () => {
    const response = await POST(
      new Request(`${applicationOrigin}/auth/confirm/complete`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: applicationOrigin,
        },
        body: '{',
      }),
    );

    expect(mocks.verifyOtp).not.toHaveBeenCalled();
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(`${applicationOrigin}/?auth=expired`);
  });
});
