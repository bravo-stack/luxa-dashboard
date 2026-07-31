import 'server-only';

import { resolveAuthEmailDeliveryReadiness } from './email-delivery-policy';

export function getAuthEmailDeliveryReadiness() {
  return resolveAuthEmailDeliveryReadiness({
    nodeEnv: process.env.NODE_ENV,
    vercel: process.env.VERCEL,
    vercelEnv: process.env.VERCEL_ENV,
    configurationVerified: process.env.SUPABASE_AUTH_EMAILS_VERIFIED,
  });
}

export const unsafeAuthEmailConfigurationMessage =
  'Email delivery is blocked until Supabase Auth uses the Luxa production Site URL, allows the exact Luxa callbacks, and has the checked-in invite and recovery templates installed.';
