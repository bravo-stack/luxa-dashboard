import 'server-only';

import { revalidatePath } from 'next/cache';

import {
  getAuthEmailDeliveryReadiness,
  unsafeAuthEmailConfigurationMessage,
} from '@/lib/auth/email-delivery';
import {
  getInvitationFailureMessage,
  getPendingActivationDelivery,
} from '@/lib/auth/invitations';
import {
  INVITE_EMAIL_CALLBACK_URL,
  RECOVERY_EMAIL_CALLBACK_URL,
} from '@/lib/auth/origin-policy';
import { recordSecurityEvent, requirePermission } from '@/lib/auth/workspace';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export type ActivationEmailResult = {
  message: string;
  success?: boolean;
  code?:
    'configuration_unverified' | 'delivery_failed' | 'invalid_target' | 'not_pending';
};

type InvitationTarget = {
  userId: string;
  email: string;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function sendPendingActivationEmail({
  actorUserId,
  target,
}: {
  actorUserId: string;
  target: InvitationTarget;
}): Promise<ActivationEmailResult> {
  const readiness = getAuthEmailDeliveryReadiness();

  if (!readiness.ready) {
    await recordSecurityEvent({
      action: 'invite_sent',
      actorUserId,
      targetUserId: target.userId,
      targetEmail: target.email,
      outcome: 'failed',
      metadata: { reason: 'auth_email_configuration_unverified' },
    });

    return {
      message: unsafeAuthEmailConfigurationMessage,
      code: 'configuration_unverified',
    };
  }

  const supabaseAdmin = getSupabaseAdminClient();
  const authUserResult = await supabaseAdmin.auth.admin.getUserById(target.userId);

  if (
    authUserResult.error ||
    !authUserResult.data.user ||
    authUserResult.data.user.app_metadata?.role !== 'sales_exec'
  ) {
    return {
      message: 'The pending workspace identity could not be verified safely.',
      code: 'invalid_target',
    };
  }

  const authUser = authUserResult.data.user;
  const delivery = getPendingActivationDelivery(authUser.email_confirmed_at);
  const deliveryResult =
    delivery === 'activation_recovery'
      ? await supabaseAdmin.auth.resetPasswordForEmail(target.email, {
          redirectTo: RECOVERY_EMAIL_CALLBACK_URL,
        })
      : await supabaseAdmin.auth.admin.inviteUserByEmail(target.email, {
          redirectTo: INVITE_EMAIL_CALLBACK_URL,
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

    return {
      message: getInvitationFailureMessage(deliveryResult.error),
      code: 'delivery_failed',
    };
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

export async function resendPendingActivationEmail(
  userId: string,
): Promise<ActivationEmailResult> {
  const admin = await requirePermission('members.manage');

  if (!isUuid(userId)) {
    return {
      message: 'The pending invitation could not be identified.',
      code: 'invalid_target',
    };
  }

  const supabaseAdmin = getSupabaseAdminClient();
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
      code: 'not_pending',
    };
  }

  return sendPendingActivationEmail({
    actorUserId: admin.id,
    target: {
      userId,
      email: String(membershipResult.data.email),
    },
  });
}
