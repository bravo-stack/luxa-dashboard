import { describe, expect, it } from 'vitest';

import { isSameOriginRequest } from './same-origin';

describe('same-origin mutation protection', () => {
  it('accepts requests from the exact application origin', () => {
    expect(
      isSameOriginRequest(
        'https://luxa-dashboard.vercel.app/api/dashboard/team/member/activation',
        'https://luxa-dashboard.vercel.app',
      ),
    ).toBe(true);
  });

  it('rejects missing, malformed, and cross-origin requests', () => {
    const requestUrl =
      'https://luxa-dashboard.vercel.app/api/dashboard/team/member/activation';

    expect(isSameOriginRequest(requestUrl, null)).toBe(false);
    expect(isSameOriginRequest(requestUrl, 'not-an-origin')).toBe(false);
    expect(isSameOriginRequest(requestUrl, 'https://attacker.example')).toBe(false);
  });
});
