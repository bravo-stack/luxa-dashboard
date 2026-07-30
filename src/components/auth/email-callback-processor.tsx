'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CircleAlert, Loader2, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { parseAuthEmailCallback } from '@/lib/auth/email-callback';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export function EmailCallbackProcessor() {
  const started = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const completeAuthentication = async () => {
      const payload = parseAuthEmailCallback({
        hash: window.location.hash,
        search: window.location.search,
      });

      if (payload.kind === 'error') {
        setFailed(true);
        return;
      }

      window.history.replaceState(
        {},
        document.title,
        `${window.location.pathname}?mode=${payload.mode}`,
      );

      const supabaseBrowser = getSupabaseBrowserClient();
      let authenticationError: Error | null = null;

      if (payload.kind === 'session') {
        const { error } = await supabaseBrowser.auth.setSession({
          access_token: payload.accessToken,
          refresh_token: payload.refreshToken,
        });
        authenticationError = error;
      } else if (payload.kind === 'code') {
        const { error } = await supabaseBrowser.auth.exchangeCodeForSession(payload.code);
        authenticationError = error;
      } else {
        const { error } = await supabaseBrowser.auth.verifyOtp({
          token_hash: payload.tokenHash,
          type: payload.mode,
        });
        authenticationError = error;
      }

      if (authenticationError) {
        setFailed(true);
        return;
      }

      const { data, error } = await supabaseBrowser.auth.getUser();

      if (error || !data.user) {
        setFailed(true);
        return;
      }

      window.location.replace(`/set-password?mode=${payload.mode}`);
    };

    void completeAuthentication().catch(() => setFailed(true));
  }, []);

  if (failed) {
    return (
      <div className="grid gap-5 rounded-md border border-warning/30 bg-card p-5">
        <div className="flex gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-warning/10 text-warning">
            <CircleAlert className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-card-foreground">
              This secure link could not be verified
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              It may have expired or already been used. Request a fresh link before
              continuing.
            </p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button asChild size="lg" className="h-12">
            <Link href="/forgot-password">Request new link</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12">
            <Link href="/">
              <ArrowLeft aria-hidden="true" />
              Return to sign in
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-start gap-4 rounded-md border border-primary/20 bg-surface-premium p-5"
      role="status"
      aria-live="polite"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      </span>
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          Verifying secure access
          <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Keep this page open. You will continue to password creation automatically.
        </p>
      </div>
    </div>
  );
}
