'use client';

import { type ReactNode, useActionState } from 'react';
import { Loader2, LockKeyhole, MailPlus, RotateCcw, ShieldOff } from 'lucide-react';
import { useFormStatus } from 'react-dom';

import {
  freezeMemberAccess,
  resendSalesExecutiveInvitation,
  restoreMemberAccess,
  revokeMemberSessions,
  type TeamActionState,
} from '@/app/dashboard/team/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { WorkspaceStatus } from '@/lib/auth/types';

const initialState: TeamActionState = { message: '' };

function ActionButton({
  children,
  variant = 'outline',
}: {
  children: ReactNode;
  variant?: 'destructive' | 'outline' | 'secondary';
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="sm" variant={variant} disabled={pending}>
      {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
      {children}
    </Button>
  );
}

export function MemberSecurityControls({
  userId,
  status,
}: {
  userId: string;
  status: WorkspaceStatus;
}) {
  const [revokeState, revokeAction] = useActionState(revokeMemberSessions, initialState);
  const [freezeState, freezeAction] = useActionState(freezeMemberAccess, initialState);
  const [restoreState, restoreAction] = useActionState(restoreMemberAccess, initialState);
  const [resendState, resendAction] = useActionState(
    resendSalesExecutiveInvitation,
    initialState,
  );
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

  return (
    <details className="group">
      <summary className="cursor-pointer list-none text-xs font-semibold text-primary underline-offset-4 hover:underline">
        Manage access
      </summary>
      <div className="mt-3 w-full min-w-0 space-y-4 rounded-md border border-border bg-muted/20 p-3 sm:w-96">
        {status === 'invited' ? (
          <form action={resendAction} className="space-y-2">
            <input type="hidden" name="userId" value={userId} />
            <p className="text-xs leading-5 text-muted-foreground">
              Send a fresh, single-use activation link if the original expired or was
              already opened.
            </p>
            <ActionButton variant="secondary">
              <MailPlus className="size-3.5" aria-hidden="true" />
              Send activation again
            </ActionButton>
          </form>
        ) : status === 'frozen' ? (
          <form action={restoreAction} className="space-y-2">
            <input type="hidden" name="userId" value={userId} />
            <p className="text-xs leading-5 text-muted-foreground">
              Restore sign-in. Existing sessions remain revoked, so a fresh login is
              required.
            </p>
            <ActionButton variant="secondary">
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Restore access
            </ActionButton>
          </form>
        ) : (
          <>
            <form action={revokeAction} className="space-y-2">
              <input type="hidden" name="userId" value={userId} />
              <p className="text-xs leading-5 text-muted-foreground">
                End every registered Luxa session. The account remains active and can sign
                in again.
              </p>
              <ActionButton>
                <ShieldOff className="size-3.5" aria-hidden="true" />
                End all sessions
              </ActionButton>
            </form>
            <form action={freezeAction} className="space-y-2 border-t border-border pt-3">
              <input type="hidden" name="userId" value={userId} />
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
                placeholder="e.g. Device reported stolen"
                required
                aria-invalid={Boolean(freezeState.errors?.reason)}
              />
              <p className="text-xs leading-5 text-muted-foreground">
                Freeze sign-in and revoke sessions until an administrator restores the
                account.
              </p>
              <ActionButton variant="destructive">
                <LockKeyhole className="size-3.5" aria-hidden="true" />
                Freeze account
              </ActionButton>
            </form>
          </>
        )}
        {message ? (
          <p
            className={success ? 'text-xs text-success' : 'text-xs text-destructive'}
            aria-live="polite"
          >
            {message}
          </p>
        ) : null}
      </div>
    </details>
  );
}
