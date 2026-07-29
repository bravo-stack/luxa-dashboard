'use client';

import { useActionState } from 'react';
import { ArrowRight, Check, Loader2, LockKeyhole } from 'lucide-react';
import { useFormStatus } from 'react-dom';

import { type LoginState, updatePassword } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const initialState: LoginState = { message: '' };
const requirements = [
  '12 or more characters',
  'Uppercase and lowercase letters',
  'At least one number and symbol',
  'Different from your email name',
];

function SubmitButton({ activation }: { activation: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" className="mt-1 h-12 w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" aria-hidden="true" />
          Securing account
        </>
      ) : (
        <>
          {activation ? 'Activate workspace access' : 'Save new password'}
          <ArrowRight aria-hidden="true" />
        </>
      )}
    </Button>
  );
}

export function SetPasswordForm({ activation }: { activation: boolean }) {
  const [state, formAction] = useActionState(updatePassword, initialState);

  return (
    <form action={formAction} className="grid gap-5">
      <div className="rounded-md border border-border bg-muted/25 px-4 py-3">
        <p className="text-xs font-semibold text-foreground">Password standard</p>
        <ul className="mt-2 grid gap-1.5 text-xs text-muted-foreground">
          {requirements.map((requirement) => (
            <li key={requirement} className="flex items-center gap-2">
              <Check className="size-3.5 text-primary" aria-hidden="true" />
              {requirement}
            </li>
          ))}
        </ul>
      </div>
      <div className="grid gap-2">
        <label className="text-xs font-semibold text-foreground" htmlFor="password">
          New password
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
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            className="h-12 border-border bg-card pl-10"
            required
          />
        </div>
      </div>
      <div className="grid gap-2">
        <label
          className="text-xs font-semibold text-foreground"
          htmlFor="confirmPassword"
        >
          Confirm password
        </label>
        <div className="relative">
          <LockKeyhole
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            className="h-12 border-border bg-card pl-10"
            required
          />
        </div>
      </div>
      <div className="min-h-5 text-xs font-medium text-destructive" aria-live="polite">
        {state.message}
        {state.errors?.length ? (
          <ul className="mt-2 list-disc space-y-1 pl-4">
            {state.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : null}
      </div>
      <SubmitButton activation={activation} />
    </form>
  );
}
