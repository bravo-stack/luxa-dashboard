export const DEFAULT_PRODUCTION_ORIGIN = 'https://luxa-dashboard.vercel.app';
export const DEFAULT_DEVELOPMENT_ORIGIN = 'http://localhost:3000';
export const INVITE_EMAIL_CALLBACK_URL =
  'https://luxa-dashboard.vercel.app/auth/email-callback?mode=invite';
export const RECOVERY_EMAIL_CALLBACK_URL =
  'https://luxa-dashboard.vercel.app/auth/email-callback?mode=recovery';

type ApplicationOriginEnvironment = {
  nodeEnv?: string;
  vercel?: string;
  vercelEnv?: string;
  authEmailCallbackOrigin?: string;
  nextPublicAppUrl?: string;
  appUrl?: string;
  vercelProjectProductionUrl?: string;
};

function normalizeDevelopmentOrigin(value: string | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value.startsWith('http') ? value : `https://${value}`);
    const isSecure = url.protocol === 'https:';
    const isLocalDevelopment =
      url.protocol === 'http:' &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1');

    return isSecure || isLocalDevelopment ? url.origin : null;
  } catch {
    return null;
  }
}

export function resolveApplicationOrigin(environment: ApplicationOriginEnvironment) {
  if (
    environment.nodeEnv === 'production' ||
    environment.vercel === '1' ||
    environment.vercelEnv === 'production'
  ) {
    return DEFAULT_PRODUCTION_ORIGIN;
  }

  return (
    normalizeDevelopmentOrigin(environment.authEmailCallbackOrigin) ??
    normalizeDevelopmentOrigin(environment.nextPublicAppUrl) ??
    normalizeDevelopmentOrigin(environment.appUrl) ??
    normalizeDevelopmentOrigin(environment.vercelProjectProductionUrl) ??
    DEFAULT_DEVELOPMENT_ORIGIN
  );
}
