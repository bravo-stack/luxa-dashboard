import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { LoginForm } from '@/components/auth/login-form';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Login | Luxa',
  description: 'Sign in to the private Luxa command center.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Home() {
  const session = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  if (verifySessionToken(session)) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen bg-background text-foreground">
      <section className="grid min-h-screen w-full lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,0.68fr)]">
        <div className="relative hidden overflow-hidden bg-sidebar text-sidebar-foreground lg:block">
          <div className="absolute inset-y-12 left-12 w-px bg-sidebar-border" />
          <div className="absolute right-0 bottom-0 left-0 h-52 bg-[linear-gradient(180deg,transparent,rgba(248,250,252,0.08))]" />
          <div className="relative flex min-h-screen max-w-2xl flex-col justify-between px-12 py-10">
            <div>
              <p className="text-lg font-semibold">Luxa</p>
              <p className="mt-1 text-sm text-sidebar-foreground/60">
                Private lead command
              </p>
            </div>
            <div className="pb-10">
              <p className="max-w-xl text-5xl leading-tight font-semibold tracking-normal text-balance">
                Keep the operating room quiet.
              </p>
              <p className="mt-6 max-w-md text-base leading-7 text-sidebar-foreground/68">
                Sign in before opening the dashboard workspace for lead review, analytics,
                and account controls.
              </p>
            </div>
          </div>
        </div>
        <div className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <p className="text-xl font-semibold">Luxa</p>
              <p className="mt-1 text-sm text-muted-foreground">Private lead command</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6 shadow-none sm:p-8">
              <div className="mb-8">
                <p className="text-sm font-semibold text-muted-foreground uppercase">
                  Secure access
                </p>
                <h1 className="mt-3 text-3xl leading-tight font-semibold text-card-foreground">
                  Sign in to Luxa
                </h1>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Use the temporary operator credentials to enter the dashboard.
                </p>
              </div>
              <LoginForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
