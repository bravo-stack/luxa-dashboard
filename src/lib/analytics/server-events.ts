import 'server-only';

import {
  type AnalyticsEventName,
  type AnalyticsProperties,
  isAnalyticsEventName,
  sanitizeAnalyticsProperties,
} from './events';

export type TrackEventPayload = {
  event_name?: string;
  properties?: Record<string, string | number | boolean | null | undefined>;
};

type TrackEventResult = {
  ok: boolean;
  source: 'supabase' | 'noop';
  error?: string;
};

function hasSupabaseCredentials() {
  return (
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

function getEventSource(properties: AnalyticsProperties) {
  return typeof properties.source === 'string' ? properties.source : 'website';
}

export function parseTrackEventPayload(payload: TrackEventPayload | null) {
  if (!payload?.event_name || !isAnalyticsEventName(payload.event_name)) {
    return null;
  }

  return {
    eventName: payload.event_name,
    properties: sanitizeAnalyticsProperties(payload.properties ?? {}),
  };
}

export async function trackEvent(
  eventName: AnalyticsEventName,
  properties: Record<string, string | number | boolean | null | undefined> = {},
): Promise<TrackEventResult> {
  const safeProperties = sanitizeAnalyticsProperties(properties);

  if (!hasSupabaseCredentials()) {
    return { ok: true, source: 'noop' };
  }

  const { supabaseAdmin } = await import('@/lib/supabase/admin');
  const { error } = await supabaseAdmin.from('lead_events').insert({
    lead_id: null,
    event_name: eventName,
    event_type: eventName,
    source: getEventSource(safeProperties),
    metadata: safeProperties,
  });

  if (error) {
    return {
      ok: false,
      source: 'supabase',
      error: 'Unable to record analytics event',
    };
  }

  return { ok: true, source: 'supabase' };
}
