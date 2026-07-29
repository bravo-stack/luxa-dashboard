import { describe, expect, it } from 'vitest';

import {
  canAccessLead,
  hasWorkspacePermission,
  isSessionIssuedAfter,
  validateWorkspacePassword,
} from './policy';

describe('workspace authorization policy', () => {
  it('keeps member administration and exports admin-only', () => {
    expect(hasWorkspacePermission('admin', 'members.manage')).toBe(true);
    expect(hasWorkspacePermission('sales_exec', 'members.manage')).toBe(false);
    expect(hasWorkspacePermission('sales_exec', 'leads.export')).toBe(false);
  });

  it('limits sales executives to assigned leads', () => {
    expect(canAccessLead('sales_exec', 'user-1', 'user-1')).toBe(true);
    expect(canAccessLead('sales_exec', 'user-1', 'user-2')).toBe(false);
    expect(canAccessLead('admin', 'admin-1', 'user-2')).toBe(true);
  });

  it('enforces the workspace password policy', () => {
    expect(validateWorkspacePassword('Short1!').valid).toBe(false);
    expect(validateWorkspacePassword('Luxa-Strong-2026!', 'alex@example.com')).toEqual({
      valid: true,
      errors: [],
    });
    expect(
      validateWorkspacePassword('alex-Secure-2026!', 'alex@example.com').errors,
    ).toContain('Do not include your email name.');
  });

  it('invalidates sessions issued before an administrative cutoff', () => {
    expect(
      isSessionIssuedAfter('2026-07-29T10:01:00.000Z', '2026-07-29T10:00:00.000Z'),
    ).toBe(true);
    expect(
      isSessionIssuedAfter('2026-07-29T09:59:59.000Z', '2026-07-29T10:00:00.000Z'),
    ).toBe(false);
    expect(isSessionIssuedAfter(null, '2026-07-29T10:00:00.000Z')).toBe(false);
  });
});
