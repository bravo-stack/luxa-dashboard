import { getAnalyticsFunnel } from '@/lib/dashboard/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  const funnel = await getAnalyticsFunnel();

  return Response.json({ data: funnel, source: 'mock' });
}
