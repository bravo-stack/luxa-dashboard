'use client';

import { useActionState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { useFormStatus } from 'react-dom';

import {
  type FeedbackTriageState,
  updateFeedbackTriage,
} from '@/app/dashboard/feedback/actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { FeedbackItem } from '@/lib/feedback/types';
import { feedbackStatuses, feedbackStatusLabels } from '@/lib/feedback/types';

const initialState: FeedbackTriageState = { message: '' };

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="secondary" size="sm" disabled={pending}>
      {pending ? (
        <Loader2 className="animate-spin" aria-hidden="true" />
      ) : (
        <Save aria-hidden="true" />
      )}
      {pending ? 'Saving' : 'Save triage'}
    </Button>
  );
}

export function FeedbackTriageForm({ item }: { item: FeedbackItem }) {
  const [state, formAction] = useActionState(updateFeedbackTriage, initialState);

  return (
    <form action={formAction} className="grid gap-3 border-t border-border pt-4">
      <input type="hidden" name="feedbackId" value={item.id} />
      <div className="grid gap-3 sm:grid-cols-[11rem_minmax(0,1fr)]">
        <div className="grid gap-2">
          <label htmlFor={`feedback-status-${item.id}`} className="text-xs font-semibold">
            Status
          </label>
          <select
            id={`feedback-status-${item.id}`}
            name="status"
            defaultValue={item.status}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {feedbackStatuses.map((status) => (
              <option key={status} value={status}>
                {feedbackStatusLabels[status]}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <label htmlFor={`feedback-note-${item.id}`} className="text-xs font-semibold">
            Admin note <span className="font-normal text-muted-foreground">optional</span>
          </label>
          <Textarea
            id={`feedback-note-${item.id}`}
            name="adminNote"
            rows={2}
            maxLength={2000}
            defaultValue={item.adminNote ?? ''}
            placeholder="Decision, owner, or resolution context"
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p
          className={state.success ? 'text-xs text-success' : 'text-xs text-destructive'}
          aria-live="polite"
        >
          {state.message}
        </p>
        <SaveButton />
      </div>
    </form>
  );
}
