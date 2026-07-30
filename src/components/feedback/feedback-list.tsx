import { Bug, CalendarClock, Lightbulb, UserRound } from 'lucide-react';

import { FeedbackTriageForm } from '@/components/feedback/feedback-triage-form';
import { Badge } from '@/components/ui/badge';
import type { FeedbackItem } from '@/lib/feedback/types';
import {
  feedbackCategoryLabels,
  feedbackImpactLabels,
  feedbackStatusLabels,
} from '@/lib/feedback/types';

const statusVariants = {
  new: 'default',
  reviewing: 'warm',
  planned: 'violet',
  resolved: 'teal',
  closed: 'secondary',
} as const;

export function FeedbackList({
  items,
  canManage,
}: {
  items: FeedbackItem[];
  canManage: boolean;
}) {
  if (!items.length) {
    return (
      <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
        <p className="text-sm font-semibold text-foreground">No feedback yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          New submissions will appear here with their review status.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-background">
      {items.map((item) => {
        const CategoryIcon = item.category === 'bug' ? Bug : Lightbulb;

        return (
          <article key={item.id} className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={item.category === 'bug' ? 'destructive' : 'violet'}>
                    <CategoryIcon className="mr-1 size-3.5" aria-hidden="true" />
                    {feedbackCategoryLabels[item.category]}
                  </Badge>
                  <Badge variant={statusVariants[item.status]}>
                    {feedbackStatusLabels[item.status]}
                  </Badge>
                  <span className="text-xs font-medium text-muted-foreground">
                    {feedbackImpactLabels[item.impact]}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 max-w-4xl text-sm leading-6 whitespace-pre-wrap text-muted-foreground">
                  {item.description}
                </p>
                {item.expectedOutcome ? (
                  <div className="mt-4 border-l-2 border-primary/40 pl-4">
                    <p className="text-xs font-semibold text-foreground">
                      Expected result
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {item.expectedOutcome}
                    </p>
                  </div>
                ) : null}
              </div>
              <dl className="grid shrink-0 gap-2 text-xs text-muted-foreground sm:w-56">
                <div className="flex items-center gap-2">
                  <UserRound className="size-3.5" aria-hidden="true" />
                  <span className="truncate">{item.submitterName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarClock className="size-3.5" aria-hidden="true" />
                  <time dateTime={item.createdAt}>
                    {new Intl.DateTimeFormat('en', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(item.createdAt))}
                  </time>
                </div>
                {item.pagePath ? (
                  <div
                    className="truncate font-mono text-[0.6875rem]"
                    title={item.pagePath}
                  >
                    {item.pagePath}
                  </div>
                ) : null}
              </dl>
            </div>
            {item.adminNote && !canManage ? (
              <div className="mt-4 rounded-md bg-muted/40 p-4">
                <p className="text-xs font-semibold text-foreground">Admin update</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {item.adminNote}
                </p>
              </div>
            ) : null}
            {canManage ? <FeedbackTriageForm item={item} /> : null}
          </article>
        );
      })}
    </div>
  );
}
