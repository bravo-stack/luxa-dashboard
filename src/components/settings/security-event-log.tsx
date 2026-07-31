import {
  KeyRound,
  LogIn,
  LogOut,
  MailPlus,
  MonitorOff,
  ShieldAlert,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { SecurityEventOverview } from '@/lib/auth/team';

const eventPresentation: Record<string, { label: string; icon: typeof ShieldCheck }> = {
  invite_sent: { label: 'Invitation sent', icon: MailPlus },
  account_activated: { label: 'Account activated', icon: UserRoundCheck },
  login_succeeded: { label: 'Signed in', icon: LogIn },
  login_failed: { label: 'Sign-in denied', icon: ShieldAlert },
  logout: { label: 'Signed out', icon: LogOut },
  password_reset_requested: { label: 'Password reset requested', icon: KeyRound },
  password_changed: { label: 'Password changed', icon: KeyRound },
  sessions_revoked: { label: 'Sessions ended', icon: MonitorOff },
  account_frozen: { label: 'Account frozen', icon: ShieldAlert },
  account_unfrozen: { label: 'Access restored', icon: ShieldCheck },
  lead_assigned: { label: 'Lead assigned', icon: UserRoundCheck },
  lead_claimed: { label: 'Lead claimed', icon: UserRoundCheck },
  lead_deletion_requested: { label: 'Lead deletion requested', icon: ShieldAlert },
  lead_deletion_approved: { label: 'Lead deletion approved', icon: ShieldAlert },
  lead_deletion_rejected: { label: 'Lead deletion rejected', icon: ShieldCheck },
};

const dateFormatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function SecurityEventLog({ events }: { events: SecurityEventOverview[] }) {
  if (!events.length) {
    return (
      <div className="flex min-h-44 items-center justify-center px-5 py-8 text-center">
        <div>
          <ShieldCheck
            className="mx-auto size-5 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-semibold text-foreground">
            No access events recorded yet
          </p>
          <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
            New logins, recovery events, invitations, and incident actions will appear
            here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {events.map((event) => {
        const presentation = eventPresentation[event.action] ?? {
          label: event.action.replaceAll('_', ' '),
          icon: ShieldCheck,
        };
        const Icon = presentation.icon;

        return (
          <article
            key={event.id}
            className="grid gap-4 px-5 py-4 md:grid-cols-[auto_minmax(12rem,1fr)_minmax(12rem,1fr)_minmax(9rem,0.7fr)_auto] md:items-center"
          >
            <span className="grid size-9 place-items-center rounded-full border border-border bg-muted/30 text-primary">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {presentation.label}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {event.targetName}
              </p>
            </div>
            <div className="min-w-0 text-xs">
              <p className="truncate text-foreground">Actor: {event.actorName}</p>
              <p className="mt-1 truncate text-muted-foreground">
                {event.ipAddress || 'IP unavailable'}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {dateFormatter.format(new Date(event.createdAt))}
            </p>
            <Badge
              variant={
                event.outcome === 'success'
                  ? 'teal'
                  : event.outcome === 'denied'
                    ? 'warm'
                    : 'destructive'
              }
              className="w-fit"
            >
              {event.outcome}
            </Badge>
          </article>
        );
      })}
    </div>
  );
}
