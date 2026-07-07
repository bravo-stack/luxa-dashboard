import type { AnalyticsSummary, DateRangeKey } from './types';

const snapshotKey = 'analytics_overview';

function hasSupabaseServerCredentials() {
  return (
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

function isAnalyticsSummary(payload: unknown): payload is AnalyticsSummary {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'metrics' in payload &&
    'funnel' in payload &&
    'topLandingPages' in payload
  );
}

export async function getAnalyticsSnapshot(
  dateRange: DateRangeKey,
): Promise<AnalyticsSummary | null> {
  if (!hasSupabaseServerCredentials()) {
    return null;
  }

  const { supabaseAdmin } = await import('@/lib/supabase/admin');
  const { data, error } = await supabaseAdmin
    .from('analytics_snapshots')
    .select('payload')
    .eq('snapshot_key', snapshotKey)
    .eq('date_range_key', dateRange)
    .order('captured_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !isAnalyticsSummary(data?.payload)) {
    return null;
  }

  return {
    ...data.payload,
    source: 'supabase',
  };
}
