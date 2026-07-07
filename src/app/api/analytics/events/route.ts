import {
  isAnalyticsEventName,
  sanitizeAnalyticsProperties,
} from '@/lib/analytics/events';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    event_name?: string;
    properties?: Record<string, string | number | boolean | null | undefined>;
  } | null;

  if (!body?.event_name || !isAnalyticsEventName(body.event_name)) {
    return Response.json(
      { ok: false, error: 'Invalid analytics event' },
      { status: 400 },
    );
  }

  const properties = sanitizeAnalyticsProperties(body.properties ?? {});
  const hasSupabaseCredentials =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!hasSupabaseCredentials) {
    return Response.json({ ok: true, source: 'noop' });
  }

  const { supabaseAdmin } = await import('@/lib/supabase/admin');
  const { error } = await supabaseAdmin.from('lead_events').insert({
    lead_id: typeof properties.lead_id === 'string' ? properties.lead_id : null,
    event_name: body.event_name,
    event_type: body.event_name,
    source: typeof properties.source === 'string' ? properties.source : 'website',
    metadata: properties,
  });

  if (error) {
    return Response.json(
      { ok: false, error: 'Unable to record analytics event' },
      { status: 500 },
    );
  }

  return Response.json({ ok: true, source: 'supabase' });
}
