import {
  CalendarCheck,
  FileCheck2,
  Mail,
  MessageSquarePlus,
  MousePointerClick,
  Send,
  Shuffle,
} from 'lucide-react';

import { EmptyState } from '@/components/dashboard/empty-state';
import type { LeadEvent, LeadEventType } from '@/lib/dashboard/types';
import { formatDateTime, getEventLabel } from '@/lib/dashboard/utils';

type LeadTimelineProps = {
  events: LeadEvent[];
};

const eventIcons: Record<LeadEventType, typeof FileCheck2> = {
  quick_start_submitted: FileCheck2,
  audit_submitted: FileCheck2,
  schedule_clicked: CalendarCheck,
  email_clicked: Mail,
  status_changed: Shuffle,
  note_added: MessageSquarePlus,
  proposal_sent: Send,
};

export function LeadTimeline({ events }: LeadTimelineProps) {
  if (!events.length) {
    return (
      <EmptyState
        icon={MousePointerClick}
        title="No timeline events yet"
        description="Lead activity, audit submissions, and internal actions will appear here once captured."
      />
    );
  }

  return (
    <section className="surface-elevated rounded-lg p-5 sm:p-6">
      <div>
        <p className="text-xs font-semibold text-accent-teal uppercase">Timeline</p>
        <h2 className="mt-2 text-xl font-semibold text-foreground">Lead events</h2>
      </div>
      <div className="mt-6 space-y-4">
        {events.map((event) => {
          const Icon = eventIcons[event.event_type];

          return (
            <div key={event.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="flex size-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="mt-2 h-full w-px bg-border" aria-hidden="true" />
              </div>
              <div className="min-w-0 pb-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    {getEventLabel(event.event_type)}
                  </h3>
                  <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
                    {event.source}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDateTime(event.created_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
