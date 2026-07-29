import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AuthShell } from '@/components/auth/auth-shell';
import { SetPasswordForm } from '@/components/auth/set-password-form';
import { getWorkspaceUser } from '@/lib/auth/workspace';

export const metadata: Metadata = {
  title: 'Secure account | Luxa',
  description: 'Secure and activate your Luxa workspace account.',
  robots: { index: false, follow: false },
};

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const [params, user] = await Promise.all([
    searchParams,
    getWorkspaceUser({ allowInactive: true, touchSession: false }),
  ]);

  if (!user) redirect('/?auth=expired');

  const activation = params.mode === 'invite' || user.status === 'invited';

  return (
    <AuthShell
      eyebrow={activation ? 'Invitation accepted' : 'Secure recovery'}
      title={activation ? 'Create your workspace password' : 'Choose a new password'}
      description={
        activation
          ? `Welcome, ${user.displayName}. Set one strong password to activate your sales workspace.`
          : 'This reset session is verified. Choose a new password to protect your account.'
      }
      statusLabel="Verified secure link"
    >
      <SetPasswordForm activation={activation} />
    </AuthShell>
  );
}
