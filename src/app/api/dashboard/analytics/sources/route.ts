import { getSourcePerformance } from '@/lib/dashboard/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  const sources = await getSourcePerformance();

  return Response.json({ data: sources, source: 'mock' });
}
