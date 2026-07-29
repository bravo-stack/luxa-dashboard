'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { useFormStatus } from 'react-dom';

import { type LoginState, requestPasswordReset } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const initialState: LoginState = { message: '' };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" className="h-12 w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" aria-hidden="true" />
          Sending secure link
        </>
      ) : (
        'Send reset link'
      )}
    </Button>
  );
}

export function PasswordResetForm() {
  const [state, formAction] = useActionState(requestPasswordReset, initialState);

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-2">
        <label className="text-xs font-semibold text-foreground" htmlFor="email">
          Work email
        </label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={320}
            className="h-12 border-border bg-card pl-10"
            placeholder="you@company.com"
            required
          />
        </div>
      </div>
      <div
        className={
          state.success
            ? 'flex min-h-12 items-start gap-2 rounded-md border border-success/25 bg-success/8 px-3 py-2.5 text-xs leading-5 text-success'
            : 'min-h-5 text-xs font-medium text-destructive'
        }
        aria-live="polite"
      >
        {state.success ? (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        ) : null}
        <span>{state.message}</span>
      </div>
      <SubmitButton />
      <Button asChild variant="ghost" className="w-full">
        <Link href="/">
          <ArrowLeft className="size-4" />
          Return to sign in
        </Link>
      </Button>
    </form>
  );
}
