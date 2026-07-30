'use server';

import { revalidatePath } from 'next/cache';

import {
  getInvitationExceptionCode,
  getInvitationFailureMessage,
  getPendingActivationDelivery,
  getUnexpectedInvitationFailureMessage,
} from '@/lib/auth/invitations';
import { getApplicationOrigin } from '@/lib/auth/origin';
import { recordSecurityEvent, requirePermission } from '@/lib/auth/workspace';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export type TeamActionState = {
  message: string;
  success?: boolean;
  errors?: Partial<Record<'displayName' | 'email' | 'jobTitle' | 'reason', string>>;
};

const initialFailure: TeamActionState = {
  message: 'The request could not be completed.',
};

type InvitationTarget = {
  userId: string;
  email: string;
};

function normalizeEmail(value: FormDataEntryValue | null) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function getSalesExecutive(userId: string) {
  if (!isUuid(userId)) return null;

  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

  if (error || !data.user || data.user.app_metadata?.role !== 'sales_exec') {
    return null;
  }

  return data.user;
}

async function sendPendingActivationEmail({
  actorUserId,
  origin,
  target,
}: {
  actorUserId: string;
  origin: string;
  target: InvitationTarget;
}): Promise<TeamActionState> {
  const supabaseAdmin = getSupabaseAdminClient();
  const authUserResult = await supabaseAdmin.auth.admin.getUserById(target.userId);

  if (
    authUserResult.error ||
    !authUserResult.data.user ||
    authUserResult.data.user.app_metadata?.role !== 'sales_exec'
  ) {
    return {
      message: 'The pending workspace identity could not be verified safely.',
    };
  }

  const authUser = authUserResult.data.user;
  const delivery = getPendingActivationDelivery(authUser.email_confirmed_at);
  const deliveryResult =
    delivery === 'activation_recovery'
      ? await supabaseAdmin.auth.resetPasswordForEmail(target.email, {
          redirectTo: `${origin}/auth/confirm`,
        })
      : await supabaseAdmin.auth.admin.inviteUserByEmail(target.email, {
          redirectTo: `${origin}/auth/confirm`,
          data: {
            full_name: authUser.user_metadata?.full_name,
            job_title: authUser.user_metadata?.job_title,
          },
        });

  if (deliveryResult.error) {
    await recordSecurityEvent({
      action: 'invite_sent',
      actorUserId,
      targetUserId: target.userId,
      targetEmail: target.email,
      outcome: 'failed',
      metadata: {
        delivery,
        reason: deliveryResult.error.code ?? 'provider_error',
      },
    });

    return { message: getInvitationFailureMessage(deliveryResult.error) };
  }

  const now = new Date().toISOString();
  const timestampResult = await supabaseAdmin
    .from('workspace_members')
    .update({ invited_at: now })
    .eq('user_id', target.userId)
    .eq('role', 'sales_exec')
    .eq('status', 'invited');

  if (timestampResult.error) {
    console.error(
      'Activation email sent but invitation timestamp could not be updated',
      timestampResult.error.message,
    );
  }

  await recordSecurityEvent({
    action: 'invite_sent',
    actorUserId,
    targetUserId: target.userId,
    targetEmail: target.email,
    metadata: { delivery, role: 'sales_exec' },
  });

  revalidatePath('/dashboard/team');
  revalidatePath('/dashboard/settings');

  return {
    message: `Fresh activation email sent to ${target.email}.`,
    success: true,
  };
}

async function runInviteSalesExecutive(
  _state: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const admin = await requirePermission('members.manage');
  const supabaseAdmin = getSupabaseAdminClient();
  const displayName = String(formData.get('displayName') ?? '')
    .trim()
    .slice(0, 100);
  const jobTitle = String(formData.get('jobTitle') ?? '')
    .trim()
    .slice(0, 100);
  const email = normalizeEmail(formData.get('email'));
  const errors: NonNullable<TeamActionState['errors']> = {};

  if (displayName.length < 2) errors.displayName = 'Enter the executive’s full name.';
  if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid work email address.';
  }
  if (jobTitle && jobTitle.length < 2) {
    errors.jobTitle = 'Enter a complete title or leave it blank.';
  }

  if (Object.keys(errors).length) {
    return { message: 'Review the highlighted fields.', errors };
  }

  const registryCheck = await supabaseAdmin
    .from('workspace_members')
    .select('user_id,email,role,status')
    .limit(500);

  if (registryCheck.error) {
    return {
      message:
        'The access registry is not ready. Apply the workspace migration before sending invitations.',
    };
  }

  let origin: string;

  try {
    origin = await getApplicationOrigin();
  } catch {
    return {
      message: 'Authentication email links are not configured for this deployment.',
    };
  }

  const existingMember = registryCheck.data.find(
    (member) => String(member.email).trim().toLowerCase() === email,
  );

  if (existingMember) {
    const target: InvitationTarget = {
      userId: String(existingMember.user_id),
      email: String(existingMember.email),
    };

    if (existingMember.role !== 'sales_exec') {
      return { message: 'This email already belongs to a workspace administrator.' };
    }

    if (existingMember.status === 'invited') {
      return sendPendingActivationEmail({
        actorUserId: admin.id,
        origin,
        target,
      });
    }

    return {
      message:
        existingMember.status === 'frozen'
          ? 'This sales executive is frozen. Restore access from the roster instead of sending another invitation.'
          : 'This sales executive already has active workspace access.',
    };
  }

  const now = new Date().toISOString();
  const inviteResult = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/auth/confirm`,
    data: {
      full_name: displayName,
      job_title: jobTitle || 'Sales executive',
      invited_by_name: admin.displayName,
    },
  });

  if (inviteResult.error || !inviteResult.data.user) {
    await recordSecurityEvent({
      action: 'invite_sent',
      actorUserId: admin.id,
      targetEmail: email,
      outcome: 'failed',
      metadata: { reason: inviteResult.error?.code ?? 'provider_error' },
    });

    return {
      message: getInvitationFailureMessage(inviteResult.error),
    };
  }

  const invitedUser = inviteResult.data.user;
  const authUpdate = await supabaseAdmin.auth.admin.updateUserById(invitedUser.id, {
    app_metadata: {
      ...invitedUser.app_metadata,
      role: 'sales_exec',
      account_status: 'invited',
      invited_by: admin.id,
      invited_at: now,
      sessions_valid_after: now,
    },
  });
  const membershipUpdate = await supabaseAdmin.from('workspace_members').upsert(
    {
      user_id: invitedUser.id,
      email,
      display_name: displayName,
      job_title: jobTitle || 'Sales executive',
      role: 'sales_exec',
      status: 'invited',
      invited_by: admin.id,
      invited_at: now,
      sessions_valid_after: now,
    },
    { onConflict: 'user_id' },
  );

  if (authUpdate.error || membershipUpdate.error) {
    await supabaseAdmin.auth.admin.deleteUser(invitedUser.id);
    await recordSecurityEvent({
      action: 'invite_sent',
      actorUserId: admin.id,
      targetUserId: invitedUser.id,
      targetEmail: email,
      outcome: 'failed',
      metadata: { reason: 'workspace_provisioning_failed' },
    });

    return {
      message:
        'The account could not be provisioned safely, so the invitation was rolled back.',
    };
  }

  await recordSecurityEvent({
    action: 'invite_sent',
    actorUserId: admin.id,
    targetUserId: invitedUser.id,
    targetEmail: email,
    metadata: { role: 'sales_exec' },
  });

  revalidatePath('/dashboard/team');
  revalidatePath('/dashboard/settings');

  return {
    message: `Invitation sent to ${email}.`,
    success: true,
  };
}

export async function inviteSalesExecutive(
  state: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  try {
    return await runInviteSalesExecutive(state, formData);
  } catch (error) {
    console.error(
      'Unexpected sales invitation failure',
      getInvitationExceptionCode(error),
    );

    return { message: getUnexpectedInvitationFailureMessage(error) };
  }
}

async function runResendSalesExecutiveInvitation(
  _state: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const admin = await requirePermission('members.manage');
  const supabaseAdmin = getSupabaseAdminClient();
  const userId = String(formData.get('userId') ?? '');

  if (!isUuid(userId)) return initialFailure;

  const membershipResult = await supabaseAdmin
    .from('workspace_members')
    .select('user_id,email,status')
    .eq('user_id', userId)
    .eq('role', 'sales_exec')
    .maybeSingle();

  if (
    membershipResult.error ||
    !membershipResult.data ||
    membershipResult.data.status !== 'invited'
  ) {
    return {
      message: 'Only pending sales invitations can be sent again.',
    };
  }

  let origin: string;

  try {
    origin = await getApplicationOrigin();
  } catch {
    return {
      message: 'Authentication email links are not configured for this deployment.',
    };
  }

  return sendPendingActivationEmail({
    actorUserId: admin.id,
    origin,
    target: {
      userId,
      email: String(membershipResult.data.email),
    },
  });
}

export async function resendSalesExecutiveInvitation(
  state: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  try {
    return await runResendSalesExecutiveInvitation(state, formData);
  } catch (error) {
    console.error(
      'Unexpected invitation renewal failure',
      getInvitationExceptionCode(error),
    );

    return { message: getUnexpectedInvitationFailureMessage(error) };
  }
}

export async function revokeMemberSessions(
  _state: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const admin = await requirePermission('members.manage');
  const supabaseAdmin = getSupabaseAdminClient();
  const userId = String(formData.get('userId') ?? '');
  const target = await getSalesExecutive(userId);

  if (!target) return initialFailure;

  const now = new Date().toISOString();
  const [membershipResult, sessionResult, authResult] = await Promise.all([
    supabaseAdmin
      .from('workspace_members')
      .update({ sessions_valid_after: now })
      .eq('user_id', userId)
      .eq('role', 'sales_exec')
      .select('user_id')
      .maybeSingle(),
    supabaseAdmin
      .from('workspace_sessions')
      .update({ revoked_at: now })
      .eq('user_id', userId)
      .is('revoked_at', null),
    supabaseAdmin.auth.admin.updateUserById(userId, {
      app_metadata: {
        ...target.app_metadata,
        sessions_valid_after: now,
      },
    }),
  ]);

  if (
    !membershipResult.data ||
    membershipResult.error ||
    sessionResult.error ||
    authResult.error
  ) {
    return initialFailure;
  }

  await recordSecurityEvent({
    action: 'sessions_revoked',
    actorUserId: admin.id,
    targetUserId: userId,
    targetEmail: target.email,
    metadata: { scope: 'all_workspace_sessions' },
  });

  revalidatePath('/dashboard/team');
  revalidatePath('/dashboard/settings');

  return {
    message: `All Luxa sessions for ${target.email ?? 'this member'} were ended.`,
    success: true,
  };
}

export async function freezeMemberAccess(
  _state: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const admin = await requirePermission('members.manage');
  const supabaseAdmin = getSupabaseAdminClient();
  const userId = String(formData.get('userId') ?? '');
  const reason = String(formData.get('reason') ?? '')
    .trim()
    .slice(0, 240);
  const target = await getSalesExecutive(userId);

  if (!target) return initialFailure;
  if (reason.length < 5) {
    return {
      message: 'Add a concise incident reason.',
      errors: { reason: 'Use at least five characters.' },
    };
  }

  const now = new Date().toISOString();
  const authResult = await supabaseAdmin.auth.admin.updateUserById(userId, {
    ban_duration: '876000h',
    app_metadata: {
      ...target.app_metadata,
      account_status: 'frozen',
      sessions_valid_after: now,
    },
  });

  if (authResult.error) return initialFailure;

  const [membershipResult, sessionResult] = await Promise.all([
    supabaseAdmin
      .from('workspace_members')
      .update({
        status: 'frozen',
        frozen_at: now,
        freeze_reason: reason,
        sessions_valid_after: now,
      })
      .eq('user_id', userId)
      .eq('role', 'sales_exec')
      .select('user_id')
      .maybeSingle(),
    supabaseAdmin
      .from('workspace_sessions')
      .update({ revoked_at: now })
      .eq('user_id', userId)
      .is('revoked_at', null),
  ]);

  if (!membershipResult.data || membershipResult.error || sessionResult.error) {
    console.error(
      'Supabase Auth froze the account but workspace state did not fully persist',
      membershipResult.error?.message ?? sessionResult.error?.message,
    );
  }

  await recordSecurityEvent({
    action: 'account_frozen',
    actorUserId: admin.id,
    targetUserId: userId,
    targetEmail: target.email,
    metadata: { reason },
  });

  revalidatePath('/dashboard/team');
  revalidatePath('/dashboard/settings');

  return {
    message: `${target.email ?? 'The member'} can no longer sign in.`,
    success: true,
  };
}

export async function restoreMemberAccess(
  _state: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const admin = await requirePermission('members.manage');
  const supabaseAdmin = getSupabaseAdminClient();
  const userId = String(formData.get('userId') ?? '');
  const target = await getSalesExecutive(userId);

  if (!target) return initialFailure;

  const now = new Date().toISOString();
  const authResult = await supabaseAdmin.auth.admin.updateUserById(userId, {
    ban_duration: 'none',
    app_metadata: {
      ...target.app_metadata,
      account_status: 'active',
      sessions_valid_after: now,
    },
  });

  if (authResult.error) return initialFailure;

  const membershipResult = await supabaseAdmin
    .from('workspace_members')
    .update({
      status: 'active',
      frozen_at: null,
      freeze_reason: null,
      sessions_valid_after: now,
    })
    .eq('user_id', userId)
    .eq('role', 'sales_exec')
    .select('user_id')
    .maybeSingle();

  if (!membershipResult.data || membershipResult.error) return initialFailure;

  await recordSecurityEvent({
    action: 'account_unfrozen',
    actorUserId: admin.id,
    targetUserId: userId,
    targetEmail: target.email,
  });

  revalidatePath('/dashboard/team');
  revalidatePath('/dashboard/settings');

  return {
    message: `${target.email ?? 'The member'} can sign in again with a fresh session.`,
    success: true,
  };
}
