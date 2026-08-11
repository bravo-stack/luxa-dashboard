import { describe, expect, it } from 'vitest';

import { parseEmailConfirmation } from './email-confirmation';

describe('email confirmation input', () => {
  it.each(['invite', 'recovery'] as const)('accepts a valid %s token', (type) => {
    expect(parseEmailConfirmation('valid-token-hash', type)).toEqual({
      tokenHash: 'valid-token-hash',
      type,
    });
  });

  it.each([
    [undefined, 'invite'],
    ['', 'invite'],
    [' token', 'invite'],
    ['token ', 'invite'],
    ['token', undefined],
    ['token', 'signup'],
    [['token'], 'invite'],
    ['token', ['invite']],
    ['x'.repeat(2_049), 'recovery'],
  ])('rejects malformed token and type values', (tokenHash, type) => {
    expect(parseEmailConfirmation(tokenHash, type)).toBeNull();
  });
});
