import { createClient } from '@supabase/supabase-js';

const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serverUrl = process.env.SUPABASE_URL ?? publicUrl;
const secretKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.APP_URL ??
  process.env.VERCEL_PROJECT_PRODUCTION_URL;

if (!publicUrl || !serverUrl || !secretKey) {
  throw new Error(
    'Configure NEXT_PUBLIC_SUPABASE_URL plus SUPABASE_URL/SUPABASE_SECRET_KEY',
  );
}

if (new URL(publicUrl).origin !== new URL(serverUrl).origin) {
  throw new Error('Public Auth and server credentials reference different projects');
}

if (!appUrl) {
  throw new Error('Configure NEXT_PUBLIC_APP_URL for authentication email links');
}

const supabase = createClient(new URL(serverUrl).origin, secretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
const [members, sessions, events, authUsers] = await Promise.all([
  supabase
    .from('workspace_members')
    .select('role,status,mfa_required', { count: 'exact' })
    .limit(500),
  supabase.from('workspace_sessions').select('id', { count: 'exact', head: true }),
  supabase.from('workspace_security_events').select('id', { count: 'exact', head: true }),
  supabase.auth.admin.listUsers({ page: 1, perPage: 200 }),
]);

for (const [name, result] of Object.entries({ members, sessions, events })) {
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
      appOrigin: new URL(appUrl.startsWith('http') ? appUrl : `https://${appUrl}`).origin,
      members: {
        total: members.count ?? 0,
        active: members.data?.filter((member) => member.status === 'active').length ?? 0,
        invited:
          members.data?.filter((member) => member.status === 'invited').length ?? 0,
        frozen: members.data?.filter((member) => member.status === 'frozen').length ?? 0,
      },
      registeredSessions: sessions.count ?? 0,
      securityEvents: events.count ?? 0,
      authUsers: workspaceUsers.length,
    },
    null,
    2,
  ),
);
