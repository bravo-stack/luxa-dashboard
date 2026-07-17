import { createClient } from '@supabase/supabase-js';

const email = process.argv[2]?.trim().toLowerCase();
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email) {
  throw new Error('Usage: npm run admin:grant -- admin@example.com');
}

if (!supabaseUrl || !secretKey) {
  throw new Error(
    'SUPABASE_URL and SUPABASE_SECRET_KEY must be configured (legacy variables are also supported)',
  );
}

const supabase = createClient(new URL(supabaseUrl).origin, secretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

let user;

for (let page = 1; !user; page += 1) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });

  if (error) {
    throw error;
  }

  user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);

  if (data.users.length < 100) {
    break;
  }
}

if (!user) {
  throw new Error(`No Supabase Auth user found for ${email}`);
}

const { error } = await supabase.auth.admin.updateUserById(user.id, {
  app_metadata: {
    ...user.app_metadata,
    role: 'admin',
  },
});

if (error) {
  throw error;
}

console.log(`Granted Luxa admin access to ${email}.`);
