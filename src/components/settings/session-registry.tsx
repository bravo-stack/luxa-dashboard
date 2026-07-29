import { Clock3, Laptop2, ShieldCheck, ShieldX } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { WorkspaceSessionOverview } from '@/lib/auth/team';

const dateFormatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function describeUserAgent(value: string | null) {
  if (!value) return 'Unknown client';

  const browser = value.includes('Edg/')
    ? 'Edge'
    : value.includes('Chrome/')
      ? 'Chrome'
      : value.includes('Firefox/')
        ? 'Firefox'
        : value.includes('Safari/')
          ? 'Safari'
          : 'Browser';
  const system = value.includes('Windows')
    ? 'Windows'
    : value.includes('Mac OS')
      ? 'macOS'
      : value.includes('Android')
        ? 'Android'
        : value.includes('iPhone') || value.includes('iPad')
          ? 'iOS'
          : 'Unknown OS';

  return `${browser} on ${system}`;
}

function isSessionActive(session: WorkspaceSessionOverview) {
  return (
    !session.revokedAt &&
    (!session.expiresAt || new Date(session.expiresAt).getTime() > Date.now())
  );
}

export function SessionRegistry({
  sessions,
  showMember = true,
}: {
  sessions: WorkspaceSessionOverview[];
  showMember?: boolean;
}) {
  if (!sessions.length) {
    return (
      <div className="flex min-h-44 items-center justify-center px-5 py-8 text-center">
        <div>
          <Laptop2 className="mx-auto size-5 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-foreground">
            No registered sessions yet
          </p>
          <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
            Sessions appear after teammates sign in through the upgraded access flow.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {sessions.map((session) => {
        const active = isSessionActive(session);

        return (
          <article
            key={session.id}
            className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(12rem,1fr)_minmax(12rem,1fr)_minmax(9rem,0.7fr)_auto] md:items-center"
          >
            <div className="min-w-0">
              {showMember ? (
                <>
                  <p className="truncate text-sm font-semibold text-foreground">
                    {session.memberName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {session.memberEmail}
                  </p>
                </>
              ) : (
                <p className="text-sm font-semibold text-foreground">
                  {describeUserAgent(session.userAgent)}
                </p>
              )}
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-2 truncate text-xs font-medium text-foreground">
                <Laptop2 className="size-3.5 text-muted-foreground" aria-hidden="true" />
                {describeUserAgent(session.userAgent)}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {session.ipAddress || 'IP unavailable'}
              </p>
            </div>
            <div>
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock3 className="size-3.5" aria-hidden="true" />
                Last observed
              </p>
              <p className="mt-1 text-xs font-medium text-foreground">
                {dateFormatter.format(new Date(session.lastSeenAt))}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 md:justify-end">
              <Badge variant={session.assuranceLevel === 'aal2' ? 'teal' : 'outline'}>
                {session.assuranceLevel === 'aal2' ? (
                  <ShieldCheck className="mr-1 size-3.5" />
                ) : null}
                {session.assuranceLevel.toUpperCase()}
              </Badge>
              <Badge variant={active ? 'teal' : 'secondary'}>
                {active ? (
                  <ShieldCheck className="mr-1 size-3.5" />
                ) : (
                  <ShieldX className="mr-1 size-3.5" />
                )}
                {active ? 'Active' : 'Ended'}
              </Badge>
            </div>
          </article>
        );
      })}
    </div>
  );
}
