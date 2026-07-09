import { parseTrackEventPayload, trackEvent } from '@/lib/analytics/server-events';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Parameters<
    typeof parseTrackEventPayload
  >[0];
  const event = parseTrackEventPayload(body);

  if (!event) {
    return Response.json(
      { ok: false, error: 'Invalid analytics event' },
      { status: 400 },
    );
  }

  const result = await trackEvent(event.eventName, event.properties);

  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: 500 });
  }

  return Response.json({ ok: true, source: result.source });
}
