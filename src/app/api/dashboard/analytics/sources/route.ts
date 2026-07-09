import {
  getAnalyticsFiltersFromUrl,
  getTrafficSummaryResponse,
} from '@/lib/analytics/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const response = await getTrafficSummaryResponse(
    getAnalyticsFiltersFromUrl(request.url),
  );

  return Response.json({
    ...response,
    data: {
      ctaSources: response.data.ctaClicksBySource,
      referrers: response.data.topReferrers,
      campaigns: response.data.utmCampaignPerformance,
      devices: response.data.deviceCategories,
    },
  });
}
