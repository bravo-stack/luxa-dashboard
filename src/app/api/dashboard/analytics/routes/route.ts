import {
  getAnalyticsFiltersFromUrl,
  getTrafficSummaryResponse,
} from '@/lib/analytics/server';
import { getAdminUser } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!(await getAdminUser())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const response = await getTrafficSummaryResponse(
    getAnalyticsFiltersFromUrl(request.url),
  );

  return Response.json({
    ...response,
    data: response.data.topLandingPages,
  });
}
