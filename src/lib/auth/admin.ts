import 'server-only';

import type { User } from '@supabase/supabase-js';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export const ADMIN_ROLE = 'admin';

export function isAdminUser(user: User | null): user is User {
  return user?.app_metadata?.role === ADMIN_ROLE;
}

export async function getAdminUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !isAdminUser(user)) {
    return null;
  }

  return user;
}

export async function requireAdmin() {
  const user = await getAdminUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}
