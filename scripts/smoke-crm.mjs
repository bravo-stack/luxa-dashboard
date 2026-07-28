import { randomUUID } from 'node:crypto';

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

const projectRef = new URL(serverOrigin).hostname.split('.')[0];
const checks = {};
let leadId;

try {
  const insertResult = await supabase
    .from('lead_submissions')
    .insert({
      status: 'new',
      form_type: 'quick_start',
      origin: 'website',
      idempotency_key: randomUUID(),
      locale: 'en',
      pathname: '/launch-audit-smoke',
      full_name: 'Launch audit smoke test',
      email: `launch-audit-${randomUUID()}@example.com`,
      company: 'Luxa launch audit',
      project_type: 'Temporary CRM verification',
      attribution: { entry_method: 'launch_audit_smoke' },
    })
    .select('id')
    .single();

  if (insertResult.error) {
    throw new Error(`Temporary lead insert failed: ${insertResult.error.message}`);
  }

  leadId = insertResult.data.id;
  checks.created = true;

  const updateResult = await supabase
    .from('lead_submissions')
    .update({
      status: 'qualified',
      connection_status: 'identified',
      next_follow_up_action: 'Remove after launch verification',
    })
    .eq('id', leadId)
    .select('id,status')
    .single();

  if (updateResult.error) {
    throw new Error(`Temporary lead update failed: ${updateResult.error.message}`);
  }

  checks.updated = updateResult.data.status === 'qualified';

  const historyResult = await supabase
    .from('lead_prospecting_history')
    .select('id', { count: 'exact', head: true })
    .eq('lead_id', leadId);

  if (historyResult.error) {
    throw new Error(`Prospecting history check failed: ${historyResult.error.message}`);
  }

  checks.prospectingHistoryCaptured = (historyResult.count ?? 0) >= 1;

  const noteInsertResult = await supabase
    .from('lead_submission_notes')
    .insert({
      lead_id: leadId,
      body: 'Temporary launch audit note.',
    })
    .select('id')
    .single();

  if (noteInsertResult.error) {
    throw new Error(`Temporary note insert failed: ${noteInsertResult.error.message}`);
  }

  const noteUpdateResult = await supabase
    .from('lead_submission_notes')
    .update({ body: 'Temporary launch audit note updated.' })
    .eq('id', noteInsertResult.data.id)
    .eq('lead_id', leadId)
    .select('body')
    .single();

  if (noteUpdateResult.error) {
    throw new Error(`Temporary note update failed: ${noteUpdateResult.error.message}`);
  }

  checks.noteLifecycle =
    noteUpdateResult.data.body === 'Temporary launch audit note updated.';

  const deleteResult = await supabase
    .from('lead_submissions')
    .delete()
    .eq('id', leadId)
    .select('id')
    .single();

  if (deleteResult.error) {
    throw new Error(`Temporary lead delete failed: ${deleteResult.error.message}`);
  }

  checks.deleted = deleteResult.data.id === leadId;
} finally {
  if (leadId) {
    const cleanupResult = await supabase
      .from('lead_submissions')
      .delete()
      .eq('id', leadId);

    if (cleanupResult.error) {
      throw new Error(`Smoke-test cleanup failed: ${cleanupResult.error.message}`);
    }

    const [leadResult, historyResult, noteResult] = await Promise.all([
      supabase
        .from('lead_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('id', leadId),
      supabase
        .from('lead_prospecting_history')
        .select('id', { count: 'exact', head: true })
        .eq('lead_id', leadId),
      supabase
        .from('lead_submission_notes')
        .select('id', { count: 'exact', head: true })
        .eq('lead_id', leadId),
    ]);

    const cleanupError = leadResult.error ?? historyResult.error ?? noteResult.error;

    if (cleanupError) {
      throw new Error(`Smoke-test cleanup verification failed: ${cleanupError.message}`);
    }

    checks.cleanupVerified =
      leadResult.count === 0 && historyResult.count === 0 && noteResult.count === 0;
  }
}

if (Object.values(checks).some((value) => value !== true)) {
  throw new Error(`CRM smoke test failed: ${JSON.stringify(checks)}`);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      projectRef,
      source: 'public.lead_submissions',
      checks,
    },
    null,
    2,
  ),
);
