import type { Metadata } from 'next';

import { AuthShell } from '@/components/auth/auth-shell';
import { EmailCallbackProcessor } from '@/components/auth/email-callback-processor';

export const metadata: Metadata = {
  title: 'Verify secure access | Luxa',
  description: 'Complete a verified Luxa invitation or password recovery request.',
  robots: { index: false, follow: false },
};

export default function EmailCallbackPage() {
  return (
    <AuthShell
      eyebrow="Secure email verification"
      title="Preparing your workspace"
      description="Luxa is confirming this single-use link before opening the password creation screen."
      statusLabel="Protected account setup"
    >
      <EmailCallbackProcessor />
    </AuthShell>
  );
}
