import { createClient } from '@supabase/supabase-js';

const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serverUrl = process.env.SUPABASE_URL ?? publicUrl;
const secretKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!publicUrl || !serverUrl || !secretKey) {
  throw new Error(
    'Configure NEXT_PUBLIC_SUPABASE_URL plus SUPABASE_URL/SUPABASE_SECRET_KEY (legacy service-role is supported)',
  );
}

const publicOrigin = new URL(publicUrl).origin;
const serverOrigin = new URL(serverUrl).origin;

if (publicOrigin !== serverOrigin) {
  throw new Error('Public Auth and server CRM credentials reference different projects');
}

const supabase = createClient(serverOrigin, secretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { data, count, error } = await supabase
  .from('lead_submissions')
  .select('id,status,origin,budget,timeline', { count: 'exact' })
  .order('created_at', { ascending: false })
  .range(0, 19);

if (error) {
  throw new Error(`CRM source verification failed: ${error.message}`);
}

async function verifyFilter(name, configure) {
  const query = configure(
    supabase
      .from('lead_submissions')
      .select('id', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(0, 19),
  );
  const result = await query;

  return {
    name,
    ok: !result.error,
    rows: result.data?.length ?? 0,
    total: result.count ?? 0,
  };
}

const sample = data?.[0];
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1_000).toISOString();
const filterChecks = await Promise.all([
  verifyFilter('status', (query) =>
    sample?.status ? query.eq('status', sample.status) : query,
  ),
  verifyFilter('origin', (query) =>
    sample?.origin ? query.eq('origin', sample.origin) : query,
  ),
  verifyFilter('budget', (query) =>
    sample?.budget ? query.eq('budget', sample.budget) : query,
  ),
  verifyFilter('timeline', (query) =>
    sample?.timeline ? query.eq('timeline', sample.timeline) : query,
  ),
  verifyFilter('date', (query) => query.gte('created_at', sevenDaysAgo)),
  verifyFilter('search', (query) =>
    query.or(
      [
        'full_name.ilike.*__crm_filter_probe__*',
        'email.ilike.*__crm_filter_probe__*',
        'company.ilike.*__crm_filter_probe__*',
        'website.ilike.*__crm_filter_probe__*',
      ].join(','),
    ),
  ),
]);
const failedFilter = filterChecks.find((check) => !check.ok);

if (failedFilter) {
  throw new Error(`CRM ${failedFilter.name} filter verification failed`);
}

const projectRef = new URL(serverOrigin).hostname.split('.')[0];

console.log(
  JSON.stringify(
    {
      ok: true,
      projectRef,
      source: 'public.lead_submissions',
      rows: count ?? 0,
      pageRows: data?.length ?? 0,
      pageSize: 20,
      filterChecks,
      mode: 'direct',
    },
    null,
    2,
  ),
);
