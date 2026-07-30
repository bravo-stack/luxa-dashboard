import { describe, expect, it } from 'vitest';

import {
  getInvitationFailureMessage,
  getPendingActivationDelivery,
  isDuplicateAuthAccount,
} from './invitations';

describe('invitation errors', () => {
  it('reinvites unopened accounts and recovers confirmed pending accounts', () => {
    expect(getPendingActivationDelivery(null)).toBe('invitation_reissued');
    expect(getPendingActivationDelivery('2026-07-29T20:30:00.000Z')).toBe(
      'activation_recovery',
    );
  });

  it('recognizes duplicate Auth identities', () => {
    expect(isDuplicateAuthAccount({ code: 'email_exists' })).toBe(true);
    expect(isDuplicateAuthAccount({ code: 'user_already_exists' })).toBe(true);
    expect(isDuplicateAuthAccount({ code: 'request_timeout' })).toBe(false);
  });

  it('explains production email rate limits', () => {
    expect(getInvitationFailureMessage({ code: 'over_email_send_rate_limit' })).toContain(
      'rate-limited',
    );
  });

  it('distinguishes configuration and temporary provider failures', () => {
    expect(getInvitationFailureMessage({ code: 'email_provider_disabled' })).toContain(
      'not enabled',
    );
    expect(getInvitationFailureMessage({ code: 'request_timeout' })).toContain(
      'temporarily unavailable',
    );
  });
});
