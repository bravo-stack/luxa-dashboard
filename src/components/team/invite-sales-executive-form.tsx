'use client';

import { useActionState, useEffect, useState } from 'react';
import { CheckCircle2, Loader2, MailPlus } from 'lucide-react';
import { useFormStatus } from 'react-dom';

import { inviteSalesExecutive, type TeamActionState } from '@/app/dashboard/team/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getUnexpectedInvitationFailureMessage } from '@/lib/auth/invitations';

type InviteFormState = TeamActionState & {
  submissionId: number;
};

const initialState: InviteFormState = { message: '', submissionId: 0 };
const successFadeDelayMs = 4_750;
const successDismissDelayMs = 5_000;

async function submitInvitation(
  state: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  try {
    return {
      ...(await inviteSalesExecutive(state, formData)),
      submissionId: state.submissionId + 1,
    };
  } catch (error) {
    return {
      message: getUnexpectedInvitationFailureMessage(error),
      submissionId: state.submissionId + 1,
    };
  }
}

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
  const [state, formAction] = useActionState(submitInvitation, initialState);
  const [fadingSubmissionId, setFadingSubmissionId] = useState<number | null>(null);
  const [dismissedSubmissionId, setDismissedSubmissionId] = useState<number | null>(null);
  const messageVisible =
    Boolean(state.message) && dismissedSubmissionId !== state.submissionId;
  const messageFading = state.success && fadingSubmissionId === state.submissionId;

  useEffect(() => {
    if (!state.success || !state.message) return;

    const fadeTimer = window.setTimeout(() => {
      setFadingSubmissionId(state.submissionId);
    }, successFadeDelayMs);
    const dismissTimer = window.setTimeout(() => {
      setDismissedSubmissionId(state.submissionId);
    }, successDismissDelayMs);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(dismissTimer);
    };
  }, [state.message, state.submissionId, state.success]);

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
          remains disabled. For a pending invite, use Resend invitation in the roster.
        </p>
        <SubmitButton disabled={disabled} />
      </div>
      {disabled ? (
        <p className="text-xs font-medium text-warning" role="status">
          Invitations unlock after the workspace access migration is applied.
        </p>
      ) : null}
      {messageVisible ? (
        <p
          className={
            state.success
              ? `flex items-center gap-2 text-xs font-medium text-success transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transform-none motion-reduce:transition-none ${
                  messageFading ? '-translate-y-0.5 opacity-0' : 'opacity-100'
                }`
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
