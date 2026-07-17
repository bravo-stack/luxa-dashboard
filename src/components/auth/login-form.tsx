'use client';

import { useActionState } from 'react';
import { ArrowRight, Loader2, LockKeyhole, Mail } from 'lucide-react';
import { useFormStatus } from 'react-dom';

import { login, type LoginState } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const initialState: LoginState = {
  message: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" className="mt-1 h-12 w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" aria-hidden="true" />
          Verifying access
        </>
      ) : (
        <>
          Continue to workspace
          <ArrowRight aria-hidden="true" />
        </>
      )}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(login, initialState);

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-2">
        <label className="text-xs font-semibold text-foreground" htmlFor="email">
          Email address
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
            className="h-12 border-border bg-card pl-10"
            placeholder="admin@luxa.co"
            required
          />
        </div>
      </div>
      <div className="grid gap-2">
        <label className="text-xs font-semibold text-foreground" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <LockKeyhole
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="h-12 border-border bg-card pl-10"
            placeholder="Your password"
            required
          />
        </div>
      </div>
      <p className="min-h-5 text-xs font-medium text-destructive" aria-live="polite">
        {state.message}
      </p>
      <SubmitButton />
    </form>
  );
}
