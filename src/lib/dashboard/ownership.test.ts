import { describe, expect, it } from 'vitest';

import { normalizeLeadOwner, WORKSPACE_OWNER_VALUE } from './ownership';

describe('normalizeLeadOwner', () => {
  it('maps empty and workspace selections to shared workspace ownership', () => {
    expect(normalizeLeadOwner(null)).toEqual({ valid: true, ownerUserId: null });
    expect(normalizeLeadOwner('')).toEqual({ valid: true, ownerUserId: null });
    expect(normalizeLeadOwner(WORKSPACE_OWNER_VALUE)).toEqual({
      valid: true,
      ownerUserId: null,
    });
  });

  it('keeps the previous unassigned value backward compatible', () => {
    expect(normalizeLeadOwner('unassigned')).toEqual({
      valid: true,
      ownerUserId: null,
    });
  });

  it('accepts UUID owners and rejects malformed values', () => {
    const ownerUserId = '5882a8f5-563f-42f0-8d8d-470f8b73e29f';

    expect(normalizeLeadOwner(ownerUserId)).toEqual({
      valid: true,
      ownerUserId,
    });
    expect(normalizeLeadOwner('not-a-member')).toEqual({
      valid: false,
      ownerUserId: null,
    });
  });
});
