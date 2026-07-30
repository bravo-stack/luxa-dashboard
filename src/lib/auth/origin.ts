import 'server-only';

import {
  DEFAULT_PRODUCTION_ORIGIN,
  resolveApplicationOrigin,
} from '@/lib/auth/origin-policy';

export function getApplicationOrigin() {
  return resolveApplicationOrigin({
    nodeEnv: process.env.NODE_ENV,
    authEmailCallbackOrigin: process.env.AUTH_EMAIL_CALLBACK_ORIGIN,
    nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL,
    appUrl: process.env.APP_URL,
    vercelProjectProductionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  });
}

export { DEFAULT_PRODUCTION_ORIGIN };
