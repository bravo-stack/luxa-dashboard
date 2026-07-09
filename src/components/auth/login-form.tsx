'use client';

import { useActionState } from 'react';
import { ArrowRight, Loader2, LockKeyhole, UserRound } from 'lucide-react';
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
    <Button type="submit" size="lg" className="mt-2 h-12 w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" aria-hidden="true" />
          Checking
        </>
      ) : (
        <>
          Enter dashboard
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
        <label className="text-sm font-semibold text-foreground" htmlFor="username">
          Username
        </label>
        <div className="relative">
          <UserRound
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="username"
            name="username"
            autoComplete="username"
            className="h-12 pl-10"
            placeholder="Enter username"
            required
          />
        </div>
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-semibold text-foreground" htmlFor="password">
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
            className="h-12 pl-10"
            placeholder="Enter password"
            required
          />
        </div>
      </div>
      <p className="min-h-5 text-sm font-medium text-destructive" aria-live="polite">
        {state.message}
      </p>
      <SubmitButton />
    </form>
  );
}
