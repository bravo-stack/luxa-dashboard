import {
  type WorkspacePermission,
  type WorkspaceRole,
  workspaceRoles,
  type WorkspaceStatus,
  workspaceStatuses,
} from './types';

const rolePermissions: Record<WorkspaceRole, ReadonlySet<WorkspacePermission>> = {
  admin: new Set([
    'dashboard.access',
    'analytics.read',
    'leads.read_all',
    'leads.read_assigned',
    'leads.create',
    'leads.update_all',
    'leads.update_assigned',
    'leads.assign',
    'leads.claim',
    'leads.request_delete',
    'leads.approve_delete',
    'leads.export',
    'members.manage',
    'settings.manage',
    'feedback.submit',
    'feedback.read_own',
    'feedback.read_all',
    'feedback.manage',
  ]),
  sales_exec: new Set([
    'dashboard.access',
    'leads.read_assigned',
    'leads.create',
    'leads.update_assigned',
    'leads.claim',
    'leads.request_delete',
    'feedback.submit',
    'feedback.read_own',
  ]),
};

export function isWorkspaceRole(value: unknown): value is WorkspaceRole {
  return workspaceRoles.includes(value as WorkspaceRole);
}

export function isWorkspaceStatus(value: unknown): value is WorkspaceStatus {
  return workspaceStatuses.includes(value as WorkspaceStatus);
}

export function hasWorkspacePermission(
  role: WorkspaceRole,
  permission: WorkspacePermission,
) {
  return rolePermissions[role].has(permission);
}

export function isWorkspaceAccessActive(status: WorkspaceStatus) {
  return status === 'active';
}

export function canAccessLead(
  role: WorkspaceRole,
  userId: string,
  ownerUserId: string | null | undefined,
  origin?: string,
) {
  return (
    role === 'admin' ||
    ownerUserId === userId ||
    (role === 'sales_exec' && !ownerUserId && origin === 'website')
  );
}

export type PasswordPolicyResult = {
  valid: boolean;
  errors: string[];
};

export function validateWorkspacePassword(
  password: string,
  email = '',
): PasswordPolicyResult {
  const errors: string[] = [];

  if (password.length < 12) errors.push('Use at least 12 characters.');
  if (password.length > 128) errors.push('Use no more than 128 characters.');
  if (!/[a-z]/.test(password)) errors.push('Add a lowercase letter.');
  if (!/[A-Z]/.test(password)) errors.push('Add an uppercase letter.');
  if (!/[0-9]/.test(password)) errors.push('Add a number.');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('Add a symbol.');

  const emailName = email.split('@')[0]?.trim().toLowerCase();

  if (emailName && emailName.length >= 4 && password.toLowerCase().includes(emailName)) {
    errors.push('Do not include your email name.');
  }

  return { valid: errors.length === 0, errors };
}

export function isSessionIssuedAfter(
  issuedAt: string | null,
  validAfter: string | null | undefined,
) {
  if (!validAfter) return true;
  if (!issuedAt) return false;

  const issuedAtMs = new Date(issuedAt).getTime();
  const validAfterMs = new Date(validAfter).getTime();

  return (
    Number.isFinite(issuedAtMs) &&
    Number.isFinite(validAfterMs) &&
    issuedAtMs >= validAfterMs
  );
}
