import 'server-only';

import { headers } from 'next/headers';

function normalizeConfiguredOrigin(value: string | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value.startsWith('http') ? value : `https://${value}`);

    if (url.protocol !== 'https:' && url.hostname !== 'localhost') return null;
    return url.origin;
  } catch {
    return null;
  }
}

export async function getApplicationOrigin() {
  const configuredOrigin =
    normalizeConfiguredOrigin(process.env.NEXT_PUBLIC_APP_URL) ??
    normalizeConfiguredOrigin(process.env.APP_URL) ??
    normalizeConfiguredOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL);

  if (configuredOrigin) return configuredOrigin;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Configure NEXT_PUBLIC_APP_URL before sending authentication emails');
  }

  const requestHeaders = await headers();
  const host =
    requestHeaders.get('x-forwarded-host')?.split(',')[0]?.trim() ??
    requestHeaders.get('host');

  if (!host || !/^[a-z0-9.-]+(?::\d{1,5})?$/i.test(host)) {
    throw new Error('Unable to determine the application origin');
  }

  const forwardedProtocol = requestHeaders
    .get('x-forwarded-proto')
    ?.split(',')[0]
    ?.trim();
  const protocol =
    forwardedProtocol === 'http' && host.startsWith('localhost') ? 'http' : 'https';

  return `${protocol}://${host}`;
}
