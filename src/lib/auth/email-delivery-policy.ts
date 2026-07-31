export const AUTH_EMAIL_CONFIGURATION_FLAG = 'SUPABASE_AUTH_EMAILS_VERIFIED';

type AuthEmailDeliveryEnvironment = {
  nodeEnv?: string;
  vercel?: string;
  vercelEnv?: string;
  configurationVerified?: string;
};

export type AuthEmailDeliveryReadiness = {
  ready: boolean;
  label: 'Development' | 'Verified' | 'Manual verification required';
};

function isEnabled(value: string | undefined) {
  return value?.trim().toLowerCase() === 'true';
}

export function resolveAuthEmailDeliveryReadiness(
  environment: AuthEmailDeliveryEnvironment,
): AuthEmailDeliveryReadiness {
  const isProduction =
    environment.nodeEnv === 'production' ||
    environment.vercel === '1' ||
    environment.vercelEnv === 'production';

  if (!isProduction) {
    return { ready: true, label: 'Development' };
  }

  return isEnabled(environment.configurationVerified)
    ? { ready: true, label: 'Verified' }
    : { ready: false, label: 'Manual verification required' };
}
