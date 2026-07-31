import { describe, expect, it } from 'vitest';

import {
  getInvitationExceptionCode,
  getInvitationFailureMessage,
  getPendingActivationDelivery,
  getRestoredAccountStatus,
  getUnexpectedInvitationFailureMessage,
  isDuplicateAuthAccount,
} from './invitations';

describe('invitation errors', () => {
  it('reinvites unopened accounts and recovers confirmed pending accounts', () => {
    expect(getPendingActivationDelivery(null)).toBe('invitation_reissued');
    expect(getPendingActivationDelivery('2026-07-29T20:30:00.000Z')).toBe(
      'activation_recovery',
    );
  });

  it('restores frozen invitees without activating them', () => {
    expect(getRestoredAccountStatus('invited')).toBe('invited');
    expect(getRestoredAccountStatus('active')).toBe('active');
    expect(getRestoredAccountStatus(undefined)).toBe('active');
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

  it('turns thrown action failures into safe recovery guidance', () => {
    expect(getUnexpectedInvitationFailureMessage(new Error('Unauthorized'))).toContain(
      'session',
    );
    expect(
      getUnexpectedInvitationFailureMessage(new TypeError('fetch failed')),
    ).toContain('could not be reached');
    expect(getUnexpectedInvitationFailureMessage(new Error('unknown'))).toContain(
      'Refresh',
    );
  });

  it('extracts a non-sensitive error code for server logs', () => {
    expect(getInvitationExceptionCode({ code: 'request_timeout' })).toBe(
      'request_timeout',
    );
    expect(getInvitationExceptionCode(new TypeError('fetch failed'))).toBe('TypeError');
  });
});
