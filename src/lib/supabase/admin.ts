// src/lib/supabase/admin.ts
import 'server-only';

import { createClient } from '@supabase/supabase-js';

import { normalizeSupabaseProjectUrl } from './url';

const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseUrl = process.env.SUPABASE_URL ?? publicSupabaseUrl;
const secretKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
}

if (!secretKey) {
  throw new Error('Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY');
}

const normalizedSupabaseUrl = normalizeSupabaseProjectUrl(supabaseUrl);

if (
  publicSupabaseUrl &&
  normalizeSupabaseProjectUrl(publicSupabaseUrl) !== normalizedSupabaseUrl
) {
  throw new Error(
    'SUPABASE_URL and NEXT_PUBLIC_SUPABASE_URL must reference the same project',
  );
}

export const supabaseAdmin = createClient(normalizedSupabaseUrl, secretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
