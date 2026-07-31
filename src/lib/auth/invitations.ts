type AuthEmailError = {
  code?: string;
  message?: string;
  status?: number;
};

const duplicateAccountCodes = new Set(['email_exists', 'user_already_exists']);
const deliveryConfigurationCodes = new Set([
  'email_provider_disabled',
  'provider_disabled',
  'email_address_not_authorized',
]);
const temporaryProviderCodes = new Set([
  'hook_timeout',
  'hook_timeout_after_retry',
  'over_request_rate_limit',
  'request_timeout',
]);

export function getPendingActivationDelivery(emailConfirmedAt?: string | null) {
  return emailConfirmedAt ? 'activation_recovery' : 'invitation_reissued';
}

export function getRestoredAccountStatus(previousStatus: unknown) {
  return previousStatus === 'invited' ? ('invited' as const) : ('active' as const);
}

export function isDuplicateAuthAccount(error: AuthEmailError | null | undefined) {
  return Boolean(error?.code && duplicateAccountCodes.has(error.code));
}

export function getInvitationFailureMessage(error: AuthEmailError | null | undefined) {
  if (error?.code === 'over_email_send_rate_limit') {
    return 'Email delivery is temporarily rate-limited. Wait a few minutes and retry. Configure custom SMTP in Supabase Auth for production volume.';
  }

  if (error?.code && deliveryConfigurationCodes.has(error.code)) {
    return 'Email delivery is not enabled for this address or deployment. Review the Supabase Auth email provider and SMTP settings.';
  }

  if (error?.code === 'email_address_invalid') {
    return 'The email provider rejected this address. Confirm the work email and retry.';
  }

  if (isDuplicateAuthAccount(error)) {
    return 'A Luxa account already exists for this email.';
  }

  if (
    (error?.code && temporaryProviderCodes.has(error.code)) ||
    (error?.status && error.status >= 500)
  ) {
    return 'The email provider is temporarily unavailable. Retry in a few minutes.';
  }

  return 'The invitation could not be sent. Check the Supabase Auth email delivery settings and retry.';
}

function getErrorProperty(error: unknown, property: 'code' | 'message' | 'name') {
  if (!error || typeof error !== 'object' || !(property in error)) return null;

  const value = (error as Record<string, unknown>)[property];
  return typeof value === 'string' ? value : null;
}

export function getInvitationExceptionCode(error: unknown) {
  return (
    getErrorProperty(error, 'code') ??
    getErrorProperty(error, 'name') ??
    'unknown_invitation_failure'
  );
}

export function getUnexpectedInvitationFailureMessage(error: unknown) {
  const code = getErrorProperty(error, 'code');
  const message = getErrorProperty(error, 'message') ?? '';

  if (code) {
    return getInvitationFailureMessage({ code });
  }

  if (/unauthorized|forbidden|session/i.test(message)) {
    return 'Your administrator session is no longer valid. Refresh the page and sign in again.';
  }

  if (/fetch|network|timeout|connection/i.test(message)) {
    return 'The invitation service could not be reached. Check your connection and retry.';
  }

  return 'The invitation request was interrupted. Refresh the page and try again.';
}
