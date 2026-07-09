'use client';

import {
  type AnalyticsEventName,
  type AnalyticsProperties,
  sanitizeAnalyticsProperties,
} from './events';

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: AnalyticsProperties) => void;
    };
  }
}

export async function trackEvent(
  eventName: AnalyticsEventName,
  properties: Record<string, string | number | boolean | null | undefined> = {},
) {
  const safeProperties = sanitizeAnalyticsProperties(properties);

  window.umami?.track(eventName, safeProperties);

  try {
    await fetch('/api/analytics/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_name: eventName,
        properties: safeProperties,
      }),
      keepalive: true,
    });
  } catch {
    // Telemetry must never interrupt the user path.
  }
}

export const trackAnalyticsEvent = trackEvent;

export function useAnalytics() {
  return { track: trackEvent };
}
