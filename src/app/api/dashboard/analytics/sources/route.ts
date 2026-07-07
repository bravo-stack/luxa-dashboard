import { getAnalyticsOverview } from '@/lib/dashboard/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  const analytics = await getAnalyticsOverview();

  return Response.json({
    data: {
      ctaSources: analytics.ctaClicksBySource,
      referrers: analytics.topReferrers,
      campaigns: analytics.utmCampaignPerformance,
    },
    source: analytics.source,
  });
}
