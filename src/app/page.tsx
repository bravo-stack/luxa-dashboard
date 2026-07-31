import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CircleAlert, CircleCheck } from 'lucide-react';

import { AuthShell } from '@/components/auth/auth-shell';
import { LoginForm } from '@/components/auth/login-form';
import { getWorkspaceUser } from '@/lib/auth/workspace';

export const metadata: Metadata = {
  title: 'Login | Luxa',
  description: 'Sign in to the private Luxa command center.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string }>;
}) {
  const [params, user] = await Promise.all([searchParams, getWorkspaceUser()]);

  if (user) redirect('/dashboard');

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Enter your workspace"
      description="Sign in with your authorized Luxa credentials."
    >
      {params.auth === 'expired' ? (
        <div className="mb-5 flex items-start gap-2 rounded-md border border-warning/30 bg-warning/8 px-3 py-2.5 text-xs leading-5 text-foreground">
          <CircleAlert
            className="mt-0.5 size-4 shrink-0 text-warning"
            aria-hidden="true"
          />
          <p>
            This secure link has expired or was already used. Request a fresh password
            reset, or ask your administrator for a new invitation.
          </p>
        </div>
      ) : null}
      {params.auth === 'password-updated' ? (
        <div className="mb-5 flex items-start gap-2 rounded-md border border-success/30 bg-success/8 px-3 py-2.5 text-xs leading-5 text-foreground">
          <CircleCheck
            className="mt-0.5 size-4 shrink-0 text-success"
            aria-hidden="true"
          />
          <p>
            Your password and workspace access were updated. Sign in with your new
            password to continue.
          </p>
        </div>
      ) : null}
      <LoginForm />
    </AuthShell>
  );
}
