import 'server-only';

export const DEFAULT_PRODUCTION_ORIGIN = 'https://luxa-dashboard.vercel.app';
const DEFAULT_DEVELOPMENT_ORIGIN = 'http://localhost:3000';

function normalizeConfiguredOrigin(value: string | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value.startsWith('http') ? value : `https://${value}`);
    const isSecure = url.protocol === 'https:';
    const isLocalDevelopment =
      url.protocol === 'http:' &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1');

    if (!isSecure && !isLocalDevelopment) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function getApplicationOrigin() {
  const configuredOrigin =
    normalizeConfiguredOrigin(process.env.AUTH_EMAIL_CALLBACK_ORIGIN) ??
    normalizeConfiguredOrigin(process.env.NEXT_PUBLIC_APP_URL) ??
    normalizeConfiguredOrigin(process.env.APP_URL) ??
    normalizeConfiguredOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL);

  if (configuredOrigin) return configuredOrigin;

  return process.env.NODE_ENV === 'production'
    ? DEFAULT_PRODUCTION_ORIGIN
    : DEFAULT_DEVELOPMENT_ORIGIN;
}
