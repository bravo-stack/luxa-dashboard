import { createClient } from '@supabase/supabase-js';

const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serverUrl = process.env.SUPABASE_URL ?? publicUrl;
const secretKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = 'https://luxa-dashboard.vercel.app';
const inviteCallbackUrl = `${appUrl}/auth/email-callback?mode=invite`;
const recoveryCallbackUrl = `${appUrl}/auth/email-callback?mode=recovery`;
const productionRuntime =
  process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
const authenticationEmailsVerified =
  process.env.SUPABASE_AUTH_EMAILS_VERIFIED?.trim().toLowerCase() === 'true';

if (!publicUrl || !serverUrl || !secretKey) {
  throw new Error(
    'Configure NEXT_PUBLIC_SUPABASE_URL plus SUPABASE_URL/SUPABASE_SECRET_KEY',
  );
}

if (new URL(publicUrl).origin !== new URL(serverUrl).origin) {
  throw new Error('Public Auth and server credentials reference different projects');
}

if (productionRuntime) {
  const conflictingOrigin = [
    process.env.AUTH_EMAIL_CALLBACK_ORIGIN,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL,
  ].find((value) => {
    if (!value) return false;

    try {
      const origin = new URL(value.startsWith('http') ? value : `https://${value}`)
        .origin;
      return origin !== appUrl;
    } catch {
      return true;
    }
  });

  if (conflictingOrigin) {
    throw new Error(
      `Production authentication origin conflicts with the canonical Luxa URL: ${appUrl}`,
    );
  }

  if (!authenticationEmailsVerified) {
    throw new Error(
      'Production authentication email delivery is not attested. Verify Supabase Auth URL Configuration and hosted templates, then set SUPABASE_AUTH_EMAILS_VERIFIED=true.',
    );
  }
}

const supabase = createClient(new URL(serverUrl).origin, secretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
const [members, sessions, events, feedback, leadFields, authUsers] = await Promise.all([
  supabase
    .from('workspace_members')
    .select('role,status,mfa_required', { count: 'exact' })
    .limit(500),
  supabase.from('workspace_sessions').select('id', { count: 'exact', head: true }),
  supabase.from('workspace_security_events').select('id', { count: 'exact', head: true }),
  supabase
    .from('workspace_feedback')
    .select('id,submitted_by_name,submitted_by_email,category,impact,status,admin_note', {
      count: 'exact',
    })
    .limit(1),
  supabase
    .from('lead_submissions')
    .select('phone,next_follow_up_date,qualification_notes,outcome_reason')
    .limit(1),
  supabase.auth.admin.listUsers({ page: 1, perPage: 200 }),
]);

for (const [name, result] of Object.entries({
  members,
  sessions,
  events,
  feedback,
  leadFields,
})) {
  if (result.error) {
    throw new Error(`Workspace ${name} verification failed: ${result.error.message}`);
  }
}

if (authUsers.error) {
  throw new Error(`Auth user verification failed: ${authUsers.error.message}`);
}

const workspaceUsers = authUsers.data.users.filter((user) =>
  ['admin', 'sales_exec'].includes(String(user.app_metadata?.role)),
);

console.log(
  JSON.stringify(
    {
      ok: true,
      projectRef: new URL(serverUrl).hostname.split('.')[0],
      appOrigin: appUrl,
      authenticationEmailCallbacks: {
        invite: inviteCallbackUrl,
        recovery: recoveryCallbackUrl,
        providerConfigurationVerified: authenticationEmailsVerified,
      },
      members: {
        total: members.count ?? 0,
        active: members.data?.filter((member) => member.status === 'active').length ?? 0,
        invited:
          members.data?.filter((member) => member.status === 'invited').length ?? 0,
        frozen: members.data?.filter((member) => member.status === 'frozen').length ?? 0,
      },
      registeredSessions: sessions.count ?? 0,
      securityEvents: events.count ?? 0,
      feedbackItems: feedback.count ?? 0,
      comprehensiveLeadFields: true,
      authUsers: workspaceUsers.length,
    },
    null,
    2,
  ),
);
