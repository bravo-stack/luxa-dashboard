import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  adminGetUserById: vi.fn(),
  adminUpdateUserById: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  from: vi.fn(),
  getWorkspaceUser: vi.fn(),
  recordSecurityEvent: vi.fn(),
  redirect: vi.fn(),
  refreshSession: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
  RedirectType: { replace: 'replace' },
}));

vi.mock('@/lib/auth/email-delivery', () => ({
  getAuthEmailDeliveryReadiness: () => ({ ready: true }),
}));

vi.mock('@/lib/auth/origin-policy', () => ({
  RECOVERY_EMAIL_CALLBACK_URL: 'https://luxa-dashboard.vercel.app/auth/recovery',
}));

vi.mock('@/lib/auth/policy', () => ({
  isWorkspaceRole: () => true,
  validateWorkspacePassword: () => ({ errors: [] }),
}));

vi.mock('@/lib/auth/workspace', () => ({
  getWorkspaceUser: mocks.getWorkspaceUser,
  recordSecurityEvent: mocks.recordSecurityEvent,
}));

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdminClient: () => ({
    auth: {
      admin: {
        getUserById: mocks.adminGetUserById,
        updateUserById: mocks.adminUpdateUserById,
      },
    },
    from: mocks.from,
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));

import { updatePassword } from './actions';

const workspaceUser = {
  id: '102b6fc9-9364-4a23-86f5-13eea2b8f103',
  email: 'sales@luxasolution.com',
  displayName: 'Sales Executive',
  jobTitle: 'Sales executive',
  role: 'sales_exec',
  status: 'invited',
  mfaRequired: false,
  session: {
    id: 'session-id',
    issuedAt: '2026-07-31T10:00:00.000Z',
    expiresAt: '2026-07-31T11:00:00.000Z',
    assuranceLevel: 'aal1',
  },
} as const;

const activeAuthUser = {
  id: workspaceUser.id,
  app_metadata: {
    role: workspaceUser.role,
    account_status: 'active',
  },
};

function passwordForm() {
  const formData = new FormData();
  formData.set('password', 'Secure-password-2026!');
  formData.set('confirmPassword', 'Secure-password-2026!');
  return formData;
}

describe('password completion', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const membershipQuery = {
      eq: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { user_id: workspaceUser.id },
        error: null,
      }),
      select: vi.fn(),
      update: vi.fn(),
    };
    membershipQuery.update.mockReturnValue(membershipQuery);
    membershipQuery.eq.mockReturnValue(membershipQuery);
    membershipQuery.select.mockReturnValue(membershipQuery);

    mocks.from.mockReturnValue(membershipQuery);
    mocks.getWorkspaceUser.mockResolvedValue(workspaceUser);
    mocks.recordSecurityEvent.mockResolvedValue(undefined);
    mocks.adminGetUserById.mockResolvedValue({
      data: {
        user: {
          app_metadata: {
            role: workspaceUser.role,
            account_status: 'invited',
          },
        },
      },
      error: null,
    });
    mocks.adminUpdateUserById.mockResolvedValue({ error: null });
    mocks.updateUser.mockResolvedValue({ error: null });
    mocks.signOut.mockResolvedValue({ error: null });
    mocks.createSupabaseServerClient.mockResolvedValue({
      auth: {
        refreshSession: mocks.refreshSession,
        signInWithPassword: mocks.signInWithPassword,
        signOut: mocks.signOut,
        updateUser: mocks.updateUser,
      },
    });
    mocks.redirect.mockImplementation((path: string, type: string) => {
      throw { path, type };
    });
  });

  it('refreshes active claims before replacing the password screen with dashboard', async () => {
    mocks.refreshSession.mockResolvedValue({
      data: { session: { access_token: 'new-token' }, user: activeAuthUser },
      error: null,
    });

    await expect(updatePassword({ message: '' }, passwordForm())).rejects.toEqual({
      path: '/dashboard?welcome=1',
      type: 'replace',
    });

    expect(mocks.refreshSession).toHaveBeenCalledOnce();
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
    expect(mocks.recordSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'account_activated',
        metadata: expect.objectContaining({ session_strategy: 'refresh' }),
      }),
    );
  });

  it('creates a fresh password session when refreshed claims remain stale', async () => {
    mocks.refreshSession.mockResolvedValue({
      data: {
        session: { access_token: 'stale-token' },
        user: {
          ...activeAuthUser,
          app_metadata: {
            ...activeAuthUser.app_metadata,
            account_status: 'invited',
          },
        },
      },
      error: null,
    });
    mocks.signInWithPassword.mockResolvedValue({
      data: { session: { access_token: 'fresh-token' }, user: activeAuthUser },
      error: null,
    });

    await expect(updatePassword({ message: '' }, passwordForm())).rejects.toEqual({
      path: '/dashboard?welcome=1',
      type: 'replace',
    });

    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: workspaceUser.email,
      password: 'Secure-password-2026!',
    });
    expect(mocks.recordSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ session_strategy: 'password' }),
      }),
    );
  });

  it('clears an unusable recovery session and replaces it with an actionable login', async () => {
    mocks.refreshSession.mockResolvedValue({
      data: { session: null, user: null },
      error: { code: 'refresh_token_not_found' },
    });
    mocks.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: { code: 'unexpected_failure' },
    });

    await expect(updatePassword({ message: '' }, passwordForm())).rejects.toEqual({
      path: '/?auth=password-updated',
      type: 'replace',
    });

    expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(mocks.recordSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          session_strategy: 'manual_sign_in_required',
        }),
      }),
    );
  });
});
