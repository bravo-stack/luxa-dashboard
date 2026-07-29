'use client';

import { useActionState } from 'react';
import { CheckCircle2, Loader2, MailPlus } from 'lucide-react';
import { useFormStatus } from 'react-dom';

import { inviteSalesExecutive, type TeamActionState } from '@/app/dashboard/team/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const initialState: TeamActionState = { message: '' };

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="h-11 w-full sm:w-auto"
      disabled={disabled || pending}
    >
      {pending ? (
        <>
          <Loader2 className="animate-spin" aria-hidden="true" />
          Provisioning access
        </>
      ) : (
        <>
          <MailPlus className="size-4" aria-hidden="true" />
          Send secure invitation
        </>
      )}
    </Button>
  );
}

export function InviteSalesExecutiveForm({ disabled = false }: { disabled?: boolean }) {
  const [state, formAction] = useActionState(inviteSalesExecutive, initialState);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="displayName" className="text-xs font-semibold text-foreground">
            Full name
          </label>
          <Input
            id="displayName"
            name="displayName"
            autoComplete="name"
            maxLength={100}
            placeholder="Alex Morgan"
            disabled={disabled}
            required
            aria-invalid={Boolean(state.errors?.displayName)}
          />
          {state.errors?.displayName ? (
            <p className="text-xs text-destructive">{state.errors.displayName}</p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <label htmlFor="jobTitle" className="text-xs font-semibold text-foreground">
            Job title <span className="font-normal text-muted-foreground">optional</span>
          </label>
          <Input
            id="jobTitle"
            name="jobTitle"
            autoComplete="organization-title"
            maxLength={100}
            placeholder="Sales executive"
            disabled={disabled}
            aria-invalid={Boolean(state.errors?.jobTitle)}
          />
          {state.errors?.jobTitle ? (
            <p className="text-xs text-destructive">{state.errors.jobTitle}</p>
          ) : null}
        </div>
      </div>
      <div className="grid gap-2">
        <label htmlFor="inviteEmail" className="text-xs font-semibold text-foreground">
          Work email
        </label>
        <Input
          id="inviteEmail"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={320}
          placeholder="alex@company.com"
          disabled={disabled}
          required
          aria-invalid={Boolean(state.errors?.email)}
        />
        {state.errors?.email ? (
          <p className="text-xs text-destructive">{state.errors.email}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md text-xs leading-5 text-muted-foreground">
          They will receive a single-use link to set a password. Public registration
          remains disabled.
        </p>
        <SubmitButton disabled={disabled} />
      </div>
      {disabled ? (
        <p className="text-xs font-medium text-warning" role="status">
          Invitations unlock after the workspace access migration is applied.
        </p>
      ) : null}
      {state.message ? (
        <p
          className={
            state.success
              ? 'flex items-center gap-2 text-xs font-medium text-success'
              : 'text-xs font-medium text-destructive'
          }
          aria-live="polite"
        >
          {state.success ? (
            <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
          ) : null}
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
