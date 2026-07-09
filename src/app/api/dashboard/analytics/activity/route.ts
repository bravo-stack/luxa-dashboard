import {
  getAnalyticsFiltersFromUrl,
  getRecentActivityResponse,
} from '@/lib/analytics/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const response = await getRecentActivityResponse(
    getAnalyticsFiltersFromUrl(request.url),
  );

  return Response.json(response);
}
