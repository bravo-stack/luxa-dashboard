import {
  getAnalyticsFiltersFromUrl,
  getRecentActivityResponse,
} from '@/lib/analytics/server';
import { getAdminUser } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!(await getAdminUser())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const response = await getRecentActivityResponse(
    getAnalyticsFiltersFromUrl(request.url),
  );

  return Response.json(response);
}
