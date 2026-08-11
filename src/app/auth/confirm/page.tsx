import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ArrowRight, ShieldCheck } from 'lucide-react';

import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { parseEmailConfirmation } from '@/lib/auth/email-confirmation';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Confirm secure link | Luxa',
  description: 'Review and confirm your secure Luxa account link.',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{
    token_hash?: string | string[];
    type?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const confirmation = parseEmailConfirmation(params.token_hash, params.type);

  if (!confirmation) redirect('/?auth=expired');

  const invitation = confirmation.type === 'invite';

  return (
    <AuthShell
      eyebrow={invitation ? 'Secure invitation' : 'Secure recovery'}
      title={invitation ? 'Confirm this invitation' : 'Confirm this password reset'}
      description={
        invitation
          ? 'Your invitation is ready. Continue to verify this one-time link and create your workspace password.'
          : 'Your password reset is ready. Continue to verify this one-time link and choose a new password.'
      }
      statusLabel="One step remaining"
    >
      <form
        action="/auth/confirm/complete"
        method="post"
        className="rounded-lg border border-border bg-card p-5 shadow-sm"
      >
        <input type="hidden" name="token_hash" value={confirmation.tokenHash} />
        <input type="hidden" name="type" value={confirmation.type} />

        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            <ShieldCheck className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-card-foreground">
              Confirm when you are ready
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              This final confirmation protects your one-time link from automated email
              checks.
            </p>
          </div>
        </div>

        <Button type="submit" size="lg" className="mt-5 w-full">
          {invitation ? 'Continue with invitation' : 'Continue with password reset'}
          <ArrowRight aria-hidden="true" />
        </Button>
      </form>
    </AuthShell>
  );
}
