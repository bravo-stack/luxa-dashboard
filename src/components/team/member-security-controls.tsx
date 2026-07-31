'use client';

import {
  type ComponentProps,
  type FormEvent,
  type ReactNode,
  useActionState,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  Loader2,
  LockKeyhole,
  MailPlus,
  RotateCcw,
  ShieldOff,
} from 'lucide-react';
import { useFormStatus } from 'react-dom';

import {
  freezeMemberAccess,
  restoreMemberAccess,
  revokeMemberSessions,
  type TeamActionState,
} from '@/app/dashboard/team/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { WorkspaceStatus } from '@/lib/auth/types';

const initialState: TeamActionState = { message: '' };

function ActionButton({
  children,
  pending: controlledPending,
  variant = 'outline',
}: {
  children: ReactNode;
  pending?: boolean;
  variant?: 'destructive' | 'outline' | 'secondary';
}) {
  const { pending } = useFormStatus();
  const isPending = controlledPending ?? pending;

  return (
    <Button type="submit" size="sm" variant={variant} disabled={isPending}>
      {isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
      {children}
    </Button>
  );
}

function FreezeAccessForm({
  action,
  hasReasonError,
  userId,
}: {
  action: ComponentProps<'form'>['action'];
  hasReasonError: boolean;
  userId: string;
}) {
  return (
    <form action={action} className="space-y-4 py-6">
      <input type="hidden" name="userId" value={userId} />
      <div>
        <h3 className="text-sm font-semibold text-foreground">Freeze account access</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Block new sign-ins and revoke active sessions until an administrator restores
          the account.
        </p>
      </div>
      <div className="grid gap-2">
        <label
          htmlFor={`freeze-reason-${userId}`}
          className="text-xs font-semibold text-foreground"
        >
          Incident reason
        </label>
        <Input
          id={`freeze-reason-${userId}`}
          name="reason"
          maxLength={240}
          placeholder="e.g. Recovery link exposed"
          required
          aria-invalid={hasReasonError}
        />
      </div>
      <ActionButton variant="destructive">
        <LockKeyhole className="size-3.5" aria-hidden="true" />
        Freeze account
      </ActionButton>
    </form>
  );
}

export function MemberSecurityControls({
  displayName,
  email,
  userId,
  status,
}: {
  displayName: string;
  email: string;
  userId: string;
  status: WorkspaceStatus;
}) {
  const router = useRouter();
  const [revokeState, revokeAction] = useActionState(revokeMemberSessions, initialState);
  const [freezeState, freezeAction] = useActionState(freezeMemberAccess, initialState);
  const [restoreState, restoreAction] = useActionState(restoreMemberAccess, initialState);
  const [resendState, setResendState] = useState<TeamActionState>(initialState);
  const [resendPending, setResendPending] = useState(false);
  const message =
    resendState.message ||
    restoreState.message ||
    freezeState.message ||
    revokeState.message;
  const success =
    resendState.success ||
    restoreState.success ||
    freezeState.success ||
    revokeState.success;

  async function resendActivationEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (resendPending) return;

    setResendPending(true);
    setResendState(initialState);

    try {
      const response = await fetch(
        `/api/dashboard/team/${encodeURIComponent(userId)}/activation`,
        {
          method: 'POST',
          headers: { Accept: 'application/json' },
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        message?: unknown;
        success?: unknown;
      } | null;
      const fallbackMessage =
        response.status === 401
          ? 'Your administrator session has expired. Refresh and sign in again.'
          : 'The activation request could not be completed. Refresh and try again.';

      setResendState({
        message: typeof payload?.message === 'string' ? payload.message : fallbackMessage,
        success: response.ok && payload?.success === true,
      });

      if (response.ok) router.refresh();
    } catch {
      setResendState({
        message:
          'The activation service could not be reached. Check your connection and retry.',
      });
    } finally {
      setResendPending(false);
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full justify-between sm:w-auto xl:w-full"
        >
          Manage access
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col overflow-hidden p-0">
        <header className="border-b border-border px-5 pt-6 pr-16 pb-5 sm:px-6 sm:pt-7 sm:pb-6">
          <p className="text-[0.6875rem] font-semibold tracking-[0.12em] text-primary uppercase">
            Security controls
          </p>
          <SheetTitle className="mt-2 text-xl font-semibold tracking-[-0.025em] text-foreground">
            {displayName}
          </SheetTitle>
          <SheetDescription className="mt-1 truncate text-sm text-muted-foreground">
            {email}
          </SheetDescription>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-2 sm:px-6">
          {status === 'invited' ? (
            <div className="divide-y divide-border">
              <form onSubmit={resendActivationEmail} className="space-y-4 py-6">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Send a new activation link
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Replace an expired or already-opened invitation with a fresh,
                    single-use link.
                  </p>
                </div>
                <ActionButton variant="secondary" pending={resendPending}>
                  <MailPlus className="size-3.5" aria-hidden="true" />
                  Send activation again
                </ActionButton>
              </form>
              <FreezeAccessForm
                action={freezeAction}
                hasReasonError={Boolean(freezeState.errors?.reason)}
                userId={userId}
              />
            </div>
          ) : status === 'frozen' ? (
            <form action={restoreAction} className="space-y-4 py-6">
              <input type="hidden" name="userId" value={userId} />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Restore workspace access
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Return the account to its state before the freeze. Existing sessions
                  stay revoked.
                </p>
              </div>
              <ActionButton variant="secondary">
                <RotateCcw className="size-3.5" aria-hidden="true" />
                Restore access
              </ActionButton>
            </form>
          ) : (
            <div className="divide-y divide-border">
              <form action={revokeAction} className="space-y-4 py-6">
                <input type="hidden" name="userId" value={userId} />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    End active sessions
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Sign out every registered device. The account remains active and can
                    sign in again.
                  </p>
                </div>
                <ActionButton>
                  <ShieldOff className="size-3.5" aria-hidden="true" />
                  End all sessions
                </ActionButton>
              </form>
              <FreezeAccessForm
                action={freezeAction}
                hasReasonError={Boolean(freezeState.errors?.reason)}
                userId={userId}
              />
            </div>
          )}
        </div>

        {message ? (
          <div className="border-t border-border bg-muted/30 px-5 py-4 sm:px-6">
            <p
              className={
                success
                  ? 'text-sm leading-6 text-success'
                  : 'text-sm leading-6 text-destructive'
              }
              aria-live="polite"
            >
              {message}
            </p>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
