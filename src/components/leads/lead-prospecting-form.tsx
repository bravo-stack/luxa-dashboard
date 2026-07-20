'use client';

import { useActionState, useState } from 'react';
import {
  ArrowUpRight,
  Building2,
  CalendarClock,
  ChevronDown,
  CircleDotDashed,
  Edit3,
  Link2,
  Loader2,
  MessageCircle,
  Save,
  Target,
  UserRound,
} from 'lucide-react';
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

function ExternalLink({ href, children }: { href?: string; children: React.ReactNode }) {
  if (!href) return <span className="text-muted-foreground">Not captured</span>;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
    >
      {children}
      <ArrowUpRight className="size-3.5" aria-hidden="true" />
    </a>
  );
}

function IntelligenceLine({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Target;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 py-4">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[0.6875rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          {label}
        </p>
        <div className="mt-1.5 text-sm leading-6 font-medium break-words text-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}

export function LeadProspectingForm({ lead }: { lead: Lead }) {
  const [state, formAction] = useActionState(updateLeadProspecting, initialState);
  const [isEditing, setIsEditing] = useState(false);
  const urlClassName = (
    field: 'linkedinProfileUrl' | 'focusLinkedinUrl' | 'facebookUrl',
  ) =>
    cn(
      'h-11',
      state.errors?.[field] && 'border-destructive focus-visible:ring-destructive/25',
    );

  return (
    <section className="surface-premium overflow-hidden rounded-lg">
      <div className="flex flex-col gap-5 border-b border-border px-5 py-6 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.08em] text-primary uppercase">
            Prospecting dossier
          </p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">
            Account intelligence
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The current decision-maker, fit thesis, and next move at a glance.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="shrink-0"
          aria-expanded={isEditing}
          aria-controls="prospecting-editor"
          onClick={() => setIsEditing((current) => !current)}
        >
          <Edit3 aria-hidden="true" />
          {isEditing ? 'Close editor' : 'Edit dossier'}
          <ChevronDown
            className={cn(
              'transition-transform duration-200 motion-reduce:transition-none',
              isEditing && 'rotate-180',
            )}
            aria-hidden="true"
          />
        </Button>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(17rem,0.75fr)]">
        <div className="px-5 py-6 sm:px-6 sm:py-8">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-[0.6875rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                Focus contact
              </p>
              <h3 className="mt-1.5 text-lg font-semibold text-foreground">
                {lead.focusName || 'Decision-maker not identified'}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {lead.focusTitle || 'Add a senior title to sharpen the outreach angle'}
              </p>
              <div className="mt-3 text-sm">
                <ExternalLink href={lead.focusLinkedinUrl}>
                  Open LinkedIn profile
                </ExternalLink>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-border pt-6">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-primary" aria-hidden="true" />
              <p className="text-xs font-semibold tracking-[0.08em] text-foreground uppercase">
                Fit thesis and pain points
              </p>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-7 whitespace-pre-wrap text-foreground">
              {lead.painPoints ||
                'No internal pain-point assessment has been captured for this account.'}
            </p>
          </div>
        </div>

        <div className="border-t border-border bg-muted/20 px-5 py-2 sm:px-6 lg:border-t-0 lg:border-l">
          <div className="divide-y divide-border">
            <IntelligenceLine icon={CircleDotDashed} label="Connection status">
              <span className="capitalize">
                {lead.connectionStatus?.replace(/_/g, ' ') || 'Not researched'}
              </span>
            </IntelligenceLine>
            <IntelligenceLine icon={CalendarClock} label="Last outreach">
              {lead.lastOutreachDate
                ? new Intl.DateTimeFormat('en', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  }).format(new Date(lead.lastOutreachDate))
                : 'No outreach recorded'}
            </IntelligenceLine>
            <IntelligenceLine icon={Target} label="Next follow-up">
              {lead.nextFollowUpAction || 'No next action set'}
            </IntelligenceLine>
          </div>
        </div>
      </div>

      <div className="grid border-t border-border sm:grid-cols-3 sm:divide-x sm:divide-border">
        <div className="px-5 py-4 sm:px-6">
          <IntelligenceLine icon={Building2} label="ICP category">
            {lead.icpCategory || 'Not classified'}
          </IntelligenceLine>
        </div>
        <div className="border-t border-border px-5 py-4 sm:border-t-0 sm:px-6">
          <IntelligenceLine icon={Link2} label="Company LinkedIn">
            <ExternalLink href={lead.linkedinProfileUrl}>Open company page</ExternalLink>
          </IntelligenceLine>
        </div>
        <div className="border-t border-border px-5 py-4 sm:border-t-0 sm:px-6">
          <IntelligenceLine icon={MessageCircle} label="Direct channels">
            <span className="flex flex-wrap gap-x-3 gap-y-1">
              <span>{lead.whatsapp || 'No WhatsApp'}</span>
              {lead.facebookUrl ? (
                <ExternalLink href={lead.facebookUrl}>Facebook</ExternalLink>
              ) : null}
            </span>
          </IntelligenceLine>
        </div>
      </div>

      <div
        id="prospecting-editor"
        className={cn(
          'grid border-t border-border bg-muted/15 transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none',
          isEditing ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <form action={formAction} className="px-5 py-7 sm:px-6 sm:py-8">
            <input type="hidden" name="leadId" value={lead.id} />
            <div>
              <p className="text-sm font-semibold text-foreground">Account fit</p>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
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
            </div>

            <div className="mt-8 border-t border-border pt-7">
              <p className="text-sm font-semibold text-foreground">Focus contact</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Prefer a C-level decision-maker or senior person with meaningful reach.
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

            <div className="mt-8 border-t border-border pt-7">
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

            <div className="mt-8 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
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
        </div>
      </div>
    </section>
  );
}
