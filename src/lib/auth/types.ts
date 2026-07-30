export const workspaceRoles = ['admin', 'sales_exec'] as const;
export type WorkspaceRole = (typeof workspaceRoles)[number];

export const workspaceStatuses = ['invited', 'active', 'frozen'] as const;
export type WorkspaceStatus = (typeof workspaceStatuses)[number];

export const workspacePermissions = [
  'dashboard.access',
  'analytics.read',
  'leads.read_all',
  'leads.read_assigned',
  'leads.create',
  'leads.update_all',
  'leads.update_assigned',
  'leads.assign',
  'leads.export',
  'members.manage',
  'settings.manage',
  'feedback.submit',
  'feedback.read_own',
  'feedback.read_all',
  'feedback.manage',
] as const;

export type WorkspacePermission = (typeof workspacePermissions)[number];

export type WorkspaceSessionIdentity = {
  id: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  assuranceLevel: 'aal1' | 'aal2';
};

export type WorkspaceUser = {
  id: string;
  email: string;
  displayName: string;
  jobTitle: string | null;
  role: WorkspaceRole;
  status: WorkspaceStatus;
  mfaRequired: boolean;
  session: WorkspaceSessionIdentity;
};

export type DashboardIdentity = Pick<
  WorkspaceUser,
  'id' | 'email' | 'displayName' | 'jobTitle' | 'role' | 'status' | 'mfaRequired'
> & {
  mfaEnabled: boolean;
};

export type SecurityEventAction =
  | 'invite_sent'
  | 'account_activated'
  | 'login_succeeded'
  | 'login_failed'
  | 'logout'
  | 'password_reset_requested'
  | 'password_changed'
  | 'sessions_revoked'
  | 'account_frozen'
  | 'account_unfrozen'
  | 'lead_assigned';
