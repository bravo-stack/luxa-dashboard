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
