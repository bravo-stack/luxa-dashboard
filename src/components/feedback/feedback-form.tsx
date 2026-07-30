'use client';

import { useActionState, useEffect, useRef } from 'react';
import { CheckCircle2, Loader2, MessageSquarePlus } from 'lucide-react';
import { useFormStatus } from 'react-dom';

import {
  type FeedbackActionState,
  submitFeedback,
} from '@/app/dashboard/feedback/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  feedbackCategoryLabels,
  feedbackImpactLabels,
  feedbackImpacts,
} from '@/lib/feedback/types';

const initialState: FeedbackActionState = { message: '' };

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={disabled || pending}>
      {pending ? (
        <Loader2 className="animate-spin" aria-hidden="true" />
      ) : (
        <MessageSquarePlus aria-hidden="true" />
      )}
      {pending ? 'Submitting feedback' : 'Submit feedback'}
    </Button>
  );
}

export function FeedbackForm({ disabled = false }: { disabled?: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(submitFeedback, initialState);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-5">
      <fieldset disabled={disabled} className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <label htmlFor="feedback-category" className="text-xs font-semibold">
              Feedback type
            </label>
            <select
              id="feedback-category"
              name="category"
              defaultValue="bug"
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {Object.entries(feedbackCategoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {state.errors?.category ? (
              <p className="text-xs text-destructive">{state.errors.category}</p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <label htmlFor="feedback-impact" className="text-xs font-semibold">
              Impact on work
            </label>
            <select
              id="feedback-impact"
              name="impact"
              defaultValue="improvement"
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {feedbackImpacts.map((impact) => (
                <option key={impact} value={impact}>
                  {feedbackImpactLabels[impact]}
                </option>
              ))}
            </select>
            {state.errors?.impact ? (
              <p className="text-xs text-destructive">{state.errors.impact}</p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-2">
          <label htmlFor="feedback-page" className="text-xs font-semibold">
            Affected area{' '}
            <span className="font-normal text-muted-foreground">optional</span>
          </label>
          <select
            id="feedback-page"
            name="pagePath"
            defaultValue=""
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <option value="">General workspace</option>
            <option value="/dashboard">Overview</option>
            <option value="/dashboard/leads">Leads</option>
            <option value="/dashboard/analytics">Analytics</option>
            <option value="/dashboard/team">Team administration</option>
            <option value="/dashboard/settings">Settings and security</option>
            <option value="/dashboard/guide">Sales guide</option>
          </select>
        </div>

        <div className="grid gap-2">
          <label htmlFor="feedback-title" className="text-xs font-semibold">
            Short, specific title
          </label>
          <Input
            id="feedback-title"
            name="title"
            maxLength={120}
            placeholder="Lead filter resets after opening a record"
            aria-invalid={Boolean(state.errors?.title)}
            required
          />
          {state.errors?.title ? (
            <p className="text-xs text-destructive">{state.errors.title}</p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <label htmlFor="feedback-description" className="text-xs font-semibold">
            What happened or should change?
          </label>
          <Textarea
            id="feedback-description"
            name="description"
            rows={6}
            maxLength={4000}
            placeholder="Include the steps, what you observed, and how it affects the sales workflow."
            aria-invalid={Boolean(state.errors?.description)}
            required
          />
          {state.errors?.description ? (
            <p className="text-xs text-destructive">{state.errors.description}</p>
          ) : (
            <p className="text-xs leading-5 text-muted-foreground">
              For a bug, include steps to reproduce. Do not include passwords or client
              secrets.
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <label htmlFor="feedback-outcome" className="text-xs font-semibold">
            Expected result{' '}
            <span className="font-normal text-muted-foreground">optional</span>
          </label>
          <Textarea
            id="feedback-outcome"
            name="expectedOutcome"
            rows={3}
            maxLength={2000}
            placeholder="What would a successful fix or feature let you do?"
          />
        </div>
      </fieldset>

      <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p
          className={
            state.success
              ? 'flex items-center gap-2 text-sm font-medium text-success'
              : 'text-sm font-medium text-destructive'
          }
          aria-live="polite"
        >
          {state.success ? (
            <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
          ) : null}
          {state.message}
        </p>
        <SubmitButton disabled={disabled} />
      </div>
    </form>
  );
}
