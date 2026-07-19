'use client';

import { useActionState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { useFormStatus } from 'react-dom';

import { type ProspectingState, updateLeadProspecting } from '@/app/dashboard/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Lead } from '@/lib/dashboard/types';
import { cn } from '@/lib/utils';

const initialState: ProspectingState = { message: '' };

function Field({
  label,
  name,
  error,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  children: React.ReactNode;
}) {
  const errorId = `${name}-error`;

  return (
    <div className="grid gap-2">
      <label htmlFor={name} className="text-xs font-semibold text-foreground">
        {label}
      </label>
      <div aria-describedby={error ? errorId : undefined}>{children}</div>
      {error ? (
        <p id={errorId} className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <Loader2 className="animate-spin" aria-hidden="true" />
      ) : (
        <Save aria-hidden="true" />
      )}
      {pending ? 'Saving' : 'Save prospecting details'}
    </Button>
  );
}

export function LeadProspectingForm({ lead }: { lead: Lead }) {
  const [state, formAction] = useActionState(updateLeadProspecting, initialState);
  const urlClassName = (
    field: 'linkedinProfileUrl' | 'focusLinkedinUrl' | 'facebookUrl',
  ) =>
    cn(
      'h-11',
      state.errors?.[field] && 'border-destructive focus-visible:ring-destructive/25',
    );

  return (
    <section className="surface-premium rounded-lg p-5 sm:p-6">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold text-primary uppercase">Prospecting</p>
        <h2 className="mt-2 text-xl font-semibold text-foreground">
          Account and focus contact
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Keep the target account, senior contact, and next outreach move in one place.
        </p>
      </div>

      <form action={formAction} className="mt-6">
        <input type="hidden" name="leadId" value={lead.id} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="ICP category" name="icpCategory">
            <Input
              id="icpCategory"
              name="icpCategory"
              defaultValue={lead.icpCategory}
              placeholder="Enterprise fintech"
              className="h-11"
            />
          </Field>
          <Field
            label="Company LinkedIn"
            name="linkedinProfileUrl"
            error={state.errors?.linkedinProfileUrl}
          >
            <Input
              id="linkedinProfileUrl"
              name="linkedinProfileUrl"
              inputMode="url"
              defaultValue={lead.linkedinProfileUrl}
              placeholder="linkedin.com/company/acme"
              className={urlClassName('linkedinProfileUrl')}
              aria-invalid={Boolean(state.errors?.linkedinProfileUrl)}
            />
          </Field>
        </div>

        <div className="mt-6 border-t border-border pt-6">
          <p className="text-sm font-semibold text-foreground">Focus contact</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Prefer a C-level decision-maker or another senior person with meaningful reach
            and access.
          </p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <Field label="Focus name" name="focusName">
              <Input
                id="focusName"
                name="focusName"
                defaultValue={lead.focusName}
                className="h-11"
              />
            </Field>
            <Field label="Title" name="focusTitle">
              <Input
                id="focusTitle"
                name="focusTitle"
                defaultValue={lead.focusTitle}
                placeholder="Chief Operating Officer"
                className="h-11"
              />
            </Field>
            <Field
              label="Focus LinkedIn"
              name="focusLinkedinUrl"
              error={state.errors?.focusLinkedinUrl}
            >
              <Input
                id="focusLinkedinUrl"
                name="focusLinkedinUrl"
                inputMode="url"
                defaultValue={lead.focusLinkedinUrl}
                placeholder="linkedin.com/in/name"
                className={urlClassName('focusLinkedinUrl')}
                aria-invalid={Boolean(state.errors?.focusLinkedinUrl)}
              />
            </Field>
            <Field label="Connection status" name="connectionStatus">
              <select
                id="connectionStatus"
                name="connectionStatus"
                defaultValue={lead.connectionStatus ?? 'not_researched'}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <option value="not_researched">Not researched</option>
                <option value="identified">Identified</option>
                <option value="connection_sent">Connection sent</option>
                <option value="connected">Connected</option>
                <option value="contacted">Contacted</option>
                <option value="replied">Replied</option>
              </select>
            </Field>
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-6">
          <p className="text-sm font-semibold text-foreground">Outreach plan</p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <Field label="Last outreach date" name="lastOutreachDate">
              <Input
                id="lastOutreachDate"
                name="lastOutreachDate"
                type="date"
                defaultValue={lead.lastOutreachDate?.slice(0, 10)}
                className="h-11"
              />
            </Field>
            <Field label="WhatsApp" name="whatsapp">
              <Input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                inputMode="tel"
                defaultValue={lead.whatsapp}
                placeholder="+234 800 000 0000"
                className="h-11"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Next follow-up action" name="nextFollowUpAction">
                <Input
                  id="nextFollowUpAction"
                  name="nextFollowUpAction"
                  defaultValue={lead.nextFollowUpAction}
                  placeholder="Send a tailored operations audit"
                  className="h-11"
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Pain points" name="painPoints">
                <Textarea
                  id="painPoints"
                  name="painPoints"
                  rows={4}
                  defaultValue={lead.painPoints}
                  placeholder="What business friction makes this account a strong fit?"
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field
                label="Facebook"
                name="facebookUrl"
                error={state.errors?.facebookUrl}
              >
                <Input
                  id="facebookUrl"
                  name="facebookUrl"
                  inputMode="url"
                  defaultValue={lead.facebookUrl}
                  placeholder="facebook.com/acme"
                  className={urlClassName('facebookUrl')}
                  aria-invalid={Boolean(state.errors?.facebookUrl)}
                />
              </Field>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p
            className={cn(
              'text-sm font-medium',
              state.errors ? 'text-destructive' : 'text-success',
            )}
            aria-live="polite"
          >
            {state.message}
          </p>
          <SaveButton />
        </div>
      </form>
    </section>
  );
}
