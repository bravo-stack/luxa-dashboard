// src/lib/supabase/client.ts
'use client';

import { createBrowserClient } from '@supabase/ssr';

import { normalizeSupabaseProjectUrl } from './url';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;

  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase browser authentication is not configured');
  }

  browserClient = createBrowserClient(normalizeSupabaseProjectUrl(supabaseUrl), anonKey, {
    auth: {
      detectSessionInUrl: false,
    },
  });

  return browserClient;
}
