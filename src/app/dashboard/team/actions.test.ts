import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  inviteUserByEmail: vi.fn(),
  requirePermission: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.mock('@/lib/auth/email-delivery', () => ({
  getAuthEmailDeliveryReadiness: () => ({ ready: true }),
  unsafeAuthEmailConfigurationMessage: 'Email delivery is not ready.',
}));

vi.mock('@/lib/auth/origin-policy', () => ({
  INVITE_EMAIL_CALLBACK_URL: 'https://luxa.example/auth/email-callback?mode=invite',
}));

vi.mock('@/lib/auth/invitations', () => ({
  getInvitationExceptionCode: () => 'unexpected_invitation_failure',
  getInvitationFailureMessage: () => 'The invitation could not be sent.',
  getPendingInvitationExistsMessage: (email: string) =>
    `Invitation already sent to ${email}. Use “Resend invitation” in People and security posture if they need a new link.`,
  getRestoredAccountStatus: () => 'active',
  getUnexpectedInvitationFailureMessage: () => 'The invitation request was interrupted.',
}));

vi.mock('@/lib/auth/workspace', () => ({
  recordSecurityEvent: vi.fn(),
  requirePermission: mocks.requirePermission,
}));

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdminClient: () => ({
    auth: { admin: { inviteUserByEmail: mocks.inviteUserByEmail } },
    from: mocks.from,
  }),
}));

import { inviteSalesExecutive } from './actions';

function invitationForm(email = 'alex@example.com') {
  const formData = new FormData();
  formData.set('displayName', 'Alex Morgan');
  formData.set('jobTitle', 'Sales executive');
  formData.set('email', email);
  return formData;
}

describe('sales executive invitations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePermission.mockResolvedValue({ id: 'admin-user-id' });
  });

  it('rejects an already-pending email and directs the admin to resend', async () => {
    const registryQuery = {
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            user_id: 'pending-user-id',
            email: 'alex@example.com',
            role: 'sales_exec',
            status: 'invited',
          },
        ],
        error: null,
      }),
      select: vi.fn(),
    };
    registryQuery.select.mockReturnValue(registryQuery);
    mocks.from.mockReturnValue(registryQuery);

    const result = await inviteSalesExecutive(
      { message: '' },
      invitationForm(' ALEX@example.com '),
    );

    expect(result).toEqual({
      message:
        'Invitation already sent to alex@example.com. Use “Resend invitation” in People and security posture if they need a new link.',
      errors: { email: 'This email already has a pending invitation.' },
    });
    expect(mocks.inviteUserByEmail).not.toHaveBeenCalled();
  });
});
