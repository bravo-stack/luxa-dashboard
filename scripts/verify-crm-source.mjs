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

const { count, error } = await supabase
  .from('lead_submissions')
  .select('id', { count: 'exact', head: true });

if (error) {
  throw new Error(`CRM source verification failed: ${error.message}`);
}

const projectRef = new URL(serverOrigin).hostname.split('.')[0];

console.log(
  JSON.stringify(
    {
      ok: true,
      projectRef,
      source: 'public.lead_submissions',
      rows: count ?? 0,
      mode: 'direct',
    },
    null,
    2,
  ),
);
