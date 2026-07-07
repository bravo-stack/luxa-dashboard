import { getAnalyticsSummary } from '@/lib/dashboard/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  const summary = await getAnalyticsSummary();

  return Response.json({ data: summary, source: 'mock' });
}
