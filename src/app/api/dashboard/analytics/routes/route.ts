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
    data: response.data.topLandingPages,
  });
}
