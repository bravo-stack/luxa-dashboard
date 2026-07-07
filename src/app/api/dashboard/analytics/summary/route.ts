import { getAnalyticsOverview } from '@/lib/dashboard/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  const analytics = await getAnalyticsOverview();

  return Response.json({ data: analytics.metrics, source: analytics.source });
}
