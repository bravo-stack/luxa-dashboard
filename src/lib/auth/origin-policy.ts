export const DEFAULT_PRODUCTION_ORIGIN = 'https://luxa-dashboard.vercel.app';
export const DEFAULT_DEVELOPMENT_ORIGIN = 'http://localhost:3000';

type ApplicationOriginEnvironment = {
  nodeEnv?: string;
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
  if (environment.nodeEnv === 'production') {
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
