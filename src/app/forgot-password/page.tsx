import type { Metadata } from 'next';

import { AuthShell } from '@/components/auth/auth-shell';
import { PasswordResetForm } from '@/components/auth/password-reset-form';

export const metadata: Metadata = {
  title: 'Reset password | Luxa',
  description: 'Request a secure Luxa workspace password reset.',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset your password"
      description="We’ll send a time-limited link to the work email attached to your Luxa account."
      statusLabel="Encrypted recovery"
    >
      <PasswordResetForm />
    </AuthShell>
  );
}
