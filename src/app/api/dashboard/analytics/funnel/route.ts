import {
  getAnalyticsFiltersFromUrl,
  getLeadFunnelSummaryResponse,
} from '@/lib/analytics/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const response = await getLeadFunnelSummaryResponse(
    getAnalyticsFiltersFromUrl(request.url),
  );

  return Response.json(response);
}
