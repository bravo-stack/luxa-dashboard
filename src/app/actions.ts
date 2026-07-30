'use server';

import { redirect } from 'next/navigation';

import { getApplicationOrigin } from '@/lib/auth/origin';
import { isWorkspaceRole, validateWorkspacePassword } from '@/lib/auth/policy';
import { getWorkspaceUser, recordSecurityEvent } from '@/lib/auth/workspace';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type LoginState = {
  message: string;
  success?: boolean;
  errors?: string[];
};

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') ?? '');

  if (!email || !password || email.length > 320 || password.length > 128) {
    return { message: 'Enter your email and password.' };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    await recordSecurityEvent({
      action: 'login_failed',
      targetEmail: email,
      outcome: 'denied',
      metadata: { reason: error?.code ?? 'invalid_credentials' },
    });

    return { message: 'Those credentials are not authorized.' };
  }

  const role = data.user.app_metadata?.role;
  const status =
    data.user.app_metadata?.account_status ?? (role === 'admin' ? 'active' : 'invited');

  if (!isWorkspaceRole(role) || status !== 'active') {
    if (data.session) {
      await supabase.auth.signOut({ scope: 'local' });
    }

    await recordSecurityEvent({
      action: 'login_failed',
      targetUserId: data.user.id,
      targetEmail: email,
      outcome: 'denied',
      metadata: { reason: status === 'invited' ? 'activation_required' : status },
    });

    return {
      message:
        status === 'invited'
          ? 'Finish account setup from your invitation email before signing in.'
          : 'This account is not available. Contact a Luxa administrator.',
    };
  }

  const workspaceUser = await getWorkspaceUser();

  if (!workspaceUser) {
    await supabase.auth.signOut({ scope: 'local' });
    await recordSecurityEvent({
      action: 'login_failed',
      targetUserId: data.user.id,
      targetEmail: email,
      outcome: 'denied',
      metadata: { reason: 'workspace_access_denied' },
    });

    return { message: 'This account is not authorized for the Luxa workspace.' };
  }

  await recordSecurityEvent({
    action: 'login_succeeded',
    actorUserId: workspaceUser.id,
    targetUserId: workspaceUser.id,
    targetEmail: workspaceUser.email,
    sessionId: workspaceUser.session.id,
    metadata: { role: workspaceUser.role },
  });

  redirect('/dashboard');
}

export async function requestPasswordReset(
  _state: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();

  if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { message: 'Enter a valid work email address.' };
  }

  const supabase = await createSupabaseServerClient();
  let origin: string;

  try {
    origin = await getApplicationOrigin();
  } catch {
    return {
      message:
        'Password recovery is temporarily unavailable. Contact a Luxa administrator.',
    };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm`,
  });

  await recordSecurityEvent({
    action: 'password_reset_requested',
    targetEmail: email,
    outcome: error ? 'failed' : 'success',
    metadata: { provider: 'email' },
  });

  return {
    message:
      'If this email belongs to an active Luxa account, a secure reset link is on its way.',
    success: true,
  };
}

export async function updatePassword(
  _state: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get('password') ?? '');
  const confirmation = String(formData.get('confirmPassword') ?? '');
  const workspaceUser = await getWorkspaceUser({
    allowInactive: true,
    touchSession: false,
  });

  if (!workspaceUser) {
    return {
      message: 'This secure link is no longer valid. Request a new invitation or reset.',
    };
  }

  const policy = validateWorkspacePassword(password, workspaceUser.email);
  const errors = [...policy.errors];

  if (password !== confirmation) errors.push('The passwords do not match.');
  if (errors.length) return { message: 'Create a stronger password.', errors };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return {
      message:
        error.code === 'weak_password'
          ? 'This password does not meet the authentication provider policy.'
          : 'Your password could not be saved. Request a fresh secure link and retry.',
    };
  }

  const now = new Date().toISOString();
  const wasInvited = workspaceUser.status === 'invited';
  const supabaseAdmin = getSupabaseAdminClient();
  const authUserResult = await supabaseAdmin.auth.admin.getUserById(workspaceUser.id);

  if (authUserResult.error || !authUserResult.data.user) {
    return {
      message:
        'Your password was saved, but account activation needs administrator review.',
    };
  }

  const authUpdate = await supabaseAdmin.auth.admin.updateUserById(workspaceUser.id, {
    app_metadata: {
      ...authUserResult.data.user.app_metadata,
      role: workspaceUser.role,
      account_status: 'active',
    },
  });

  if (authUpdate.error) {
    await recordSecurityEvent({
      action: wasInvited ? 'account_activated' : 'password_changed',
      actorUserId: workspaceUser.id,
      targetUserId: workspaceUser.id,
      targetEmail: workspaceUser.email,
      sessionId: workspaceUser.session.id,
      outcome: 'failed',
      metadata: { reason: 'auth_metadata_update_failed' },
    });

    return {
      message:
        'Your password was saved, but account activation needs administrator review.',
    };
  }

  if (wasInvited) {
    const membershipResult = await supabaseAdmin
      .from('workspace_members')
      .update({
        status: 'active',
        accepted_at: now,
        frozen_at: null,
        freeze_reason: null,
      })
      .eq('user_id', workspaceUser.id)
      .eq('status', 'invited')
      .select('user_id')
      .maybeSingle();

    if (!membershipResult.data || membershipResult.error) {
      console.error(
        'Unable to activate workspace membership',
        membershipResult.error?.message ?? 'Membership row not found',
      );

      await Promise.all([
        supabaseAdmin.auth.admin.updateUserById(workspaceUser.id, {
          app_metadata: {
            ...authUserResult.data.user.app_metadata,
            role: workspaceUser.role,
            account_status: 'invited',
          },
        }),
        recordSecurityEvent({
          action: 'account_activated',
          actorUserId: workspaceUser.id,
          targetUserId: workspaceUser.id,
          targetEmail: workspaceUser.email,
          sessionId: workspaceUser.session.id,
          outcome: 'failed',
          metadata: { reason: 'workspace_activation_failed' },
        }),
      ]);

      return {
        message:
          'Your password was saved, but workspace activation needs administrator review.',
      };
    }
  }

  await recordSecurityEvent({
    action: wasInvited ? 'account_activated' : 'password_changed',
    actorUserId: workspaceUser.id,
    targetUserId: workspaceUser.id,
    targetEmail: workspaceUser.email,
    sessionId: workspaceUser.session.id,
    metadata: { role: workspaceUser.role },
  });

  redirect(wasInvited ? '/dashboard?welcome=1' : '/dashboard/settings?password=updated');
}

export async function logout() {
  const user = await getWorkspaceUser({ touchSession: false });
  const supabase = await createSupabaseServerClient();

  if (user) {
    await recordSecurityEvent({
      action: 'logout',
      actorUserId: user.id,
      targetUserId: user.id,
      targetEmail: user.email,
      sessionId: user.session.id,
    });
  }

  await supabase.auth.signOut({ scope: 'local' });
  redirect('/');
}
