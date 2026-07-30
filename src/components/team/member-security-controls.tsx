'use client';

import { type ReactNode, useActionState } from 'react';
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
  resendSalesExecutiveInvitation,
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
            <form action={resendAction} className="space-y-4 py-6">
              <input type="hidden" name="userId" value={userId} />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Send a new activation link
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Replace an expired or already-opened invitation with a fresh, single-use
                  link.
                </p>
              </div>
              <ActionButton variant="secondary">
                <MailPlus className="size-3.5" aria-hidden="true" />
                Send activation again
              </ActionButton>
            </form>
          ) : status === 'frozen' ? (
            <form action={restoreAction} className="space-y-4 py-6">
              <input type="hidden" name="userId" value={userId} />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Restore workspace access
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Allow sign-in again. Existing sessions stay revoked, so the member must
                  start a fresh session.
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
              <form action={freezeAction} className="space-y-4 py-6">
                <input type="hidden" name="userId" value={userId} />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Freeze account access
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Block new sign-ins and revoke active sessions until an administrator
                    restores the account.
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
                    placeholder="e.g. Device reported stolen"
                    required
                    aria-invalid={Boolean(freezeState.errors?.reason)}
                  />
                </div>
                <ActionButton variant="destructive">
                  <LockKeyhole className="size-3.5" aria-hidden="true" />
                  Freeze account
                </ActionButton>
              </form>
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
