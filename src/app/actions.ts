'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  TEMP_PASSWORD,
  TEMP_USERNAME,
} from '@/lib/auth/session';

export type LoginState = {
  message: string;
};

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!username || !password) {
    return { message: 'Enter the username and password.' };
  }

  if (username !== TEMP_USERNAME || password !== TEMP_PASSWORD) {
    return { message: 'Those credentials did not match.' };
  }

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, createSessionToken(username), {
    httpOnly: true,
    maxAge: 60 * 60 * 8,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  redirect('/dashboard');
}
