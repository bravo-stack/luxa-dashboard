import { describe, expect, it } from 'vitest';

import { parseAuthEmailCallback } from './email-callback';

describe('authentication email callback parsing', () => {
  it('accepts the session fragment produced by the default Supabase invite email', () => {
    expect(
      parseAuthEmailCallback({
        search: '?mode=invite',
        hash: '#access_token=access-value&refresh_token=refresh-value&type=invite',
      }),
    ).toEqual({
      kind: 'session',
      mode: 'invite',
      accessToken: 'access-value',
      refreshToken: 'refresh-value',
    });
  });

  it('accepts a PKCE recovery callback', () => {
    expect(
      parseAuthEmailCallback({
        search: '?mode=recovery&code=secure-code',
        hash: '',
      }),
    ).toEqual({
      kind: 'code',
      mode: 'recovery',
      code: 'secure-code',
    });
  });

  it('accepts a token hash without exposing it beyond the parser', () => {
    expect(
      parseAuthEmailCallback({
        search: '?token_hash=secure-hash&type=invite',
        hash: '',
      }),
    ).toEqual({
      kind: 'otp',
      mode: 'invite',
      tokenHash: 'secure-hash',
    });
  });

  it('rejects mismatched flows and incomplete credentials', () => {
    expect(
      parseAuthEmailCallback({
        search: '?mode=recovery',
        hash: '#access_token=value&type=invite',
      }),
    ).toEqual({ kind: 'error' });
    expect(
      parseAuthEmailCallback({
        search: '?mode=invite',
        hash: '#access_token=value&type=invite',
      }),
    ).toEqual({ kind: 'error' });
  });
});
