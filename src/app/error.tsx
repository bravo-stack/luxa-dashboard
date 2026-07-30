'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, RefreshCw, ShieldAlert } from 'lucide-react';

import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <AuthShell
      eyebrow="Workspace interrupted"
      title="Luxa could not complete that request."
      description="Your data remains protected. Retry the operation, or return to Luxa and continue from a stable workspace."
      statusLabel="Protected recovery"
    >
      <div className="grid gap-4 rounded-md border border-border bg-card p-5">
        <div className="flex gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-destructive/10 text-destructive">
            <ShieldAlert className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-card-foreground">
              Request not completed
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Retrying is safe and will not duplicate a completed action.
            </p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button type="button" size="lg" className="h-12" onClick={unstable_retry}>
            <RefreshCw aria-hidden="true" />
            Try again
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12">
            <Link href="/">
              Return to Luxa
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}
