'use server';

import { redirect } from 'next/navigation';

import { isAdminUser } from '@/lib/auth/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type LoginState = {
  message: string;
};

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { message: 'Enter your email and password.' };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !isAdminUser(data.user)) {
    if (data.session) {
      await supabase.auth.signOut();
    }

    return { message: 'Those credentials are not authorized.' };
  }

  redirect('/dashboard');
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/');
}
