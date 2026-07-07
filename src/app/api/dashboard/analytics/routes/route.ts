import { getRoutePerformance } from '@/lib/dashboard/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  const routes = await getRoutePerformance();

  return Response.json({ data: routes, source: 'mock' });
}
