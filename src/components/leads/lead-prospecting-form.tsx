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

import { type LeadRecordState, updateLeadRecord } from '@/app/dashboard/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Lead } from '@/lib/dashboard/types';
import { getIcpCategoryLabel } from '@/lib/dashboard/utils';
import { cn } from '@/lib/utils';

import { IcpCategorySelect } from './icp-category-select';

const initialState: LeadRecordState = { message: '' };

type ErrorField = keyof NonNullable<LeadRecordState['errors']>;

function Field({
  label,
  name,
  error,
  optional = true,
  hint,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  optional?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;

  return (
    <div className="grid min-w-0 gap-2">
      <label
        htmlFor={name}
        className="flex items-center justify-between gap-3 text-xs font-semibold text-foreground"
      >
        <span>{label}</span>
        {optional ? (
          <span className="font-normal text-muted-foreground">Optional</span>
        ) : null}
      </label>
      {hint ? (
        <p id={hintId} className="text-xs leading-5 text-muted-foreground">
          {hint}
        </p>
      ) : null}
      <div>{children}</div>
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
      {pending ? 'Saving record' : 'Save lead record'}
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
    <div className="flex min-w-0 gap-3 py-4">
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

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-b border-border pb-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

export function LeadProspectingForm({ lead }: { lead: Lead }) {
  const [state, formAction] = useActionState(updateLeadRecord, initialState);
  const [isEditing, setIsEditing] = useState(false);
  const inputClassName = (field?: ErrorField) =>
    cn(
      'h-11',
      field &&
        state.errors?.[field] &&
        'border-destructive focus-visible:ring-destructive/25',
    );

  return (
    <section className="surface-premium overflow-hidden rounded-lg">
      <div className="flex flex-col gap-5 border-b border-border px-5 py-6 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.08em] text-primary uppercase">
            Sales record
          </p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">
            Opportunity intelligence
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The account, buying context, qualification evidence, and next committed move
            in one maintained record.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="shrink-0"
          aria-expanded={isEditing}
          aria-controls="lead-record-editor"
          onClick={() => setIsEditing((current) => !current)}
        >
          <Edit3 aria-hidden="true" />
          {isEditing ? 'Close editor' : 'Edit full record'}
          <ChevronDown
            className={cn(
              'transition-transform duration-200 motion-reduce:transition-none',
              isEditing && 'rotate-180',
            )}
            aria-hidden="true"
          />
        </Button>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="px-5 py-6 sm:px-6 sm:py-8">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Building2 className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-[0.6875rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                Opportunity
              </p>
              <h3 className="mt-1.5 text-lg font-semibold text-foreground">
                {lead.projectType || 'Opportunity not defined'}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {lead.company}
                {lead.industry ? ` · ${lead.industry}` : ''}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-x-8 border-t border-border pt-5 sm:grid-cols-2">
            <IntelligenceLine icon={Target} label="ICP and fit">
              {getIcpCategoryLabel(lead.icpCategory)}
            </IntelligenceLine>
            <IntelligenceLine icon={UserRound} label="Focus contact">
              {lead.focusName ? (
                <>
                  {lead.focusName}
                  {lead.focusTitle ? ` · ${lead.focusTitle}` : ''}
                </>
              ) : (
                'Decision-maker not identified'
              )}
            </IntelligenceLine>
            <IntelligenceLine icon={Building2} label="Budget signal">
              {lead.budget || 'Not established'}
            </IntelligenceLine>
            <IntelligenceLine icon={CalendarClock} label="Buying timeline">
              {lead.timeline || 'Not established'}
            </IntelligenceLine>
          </div>

          <div className="mt-3 border-t border-border pt-6">
            <p className="text-xs font-semibold tracking-[0.08em] text-foreground uppercase">
              Rep qualification summary
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-7 whitespace-pre-wrap text-foreground">
              {lead.qualificationNotes ||
                lead.painPoints ||
                'No internal qualification assessment has been captured yet.'}
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
                ? new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(
                    new Date(`${lead.lastOutreachDate}T00:00:00Z`),
                  )
                : 'No outreach recorded'}
            </IntelligenceLine>
            <IntelligenceLine icon={Target} label="Next action">
              <span className="block">
                {lead.nextFollowUpAction || lead.nextStep || 'No next action set'}
              </span>
              {lead.nextFollowUpDate ? (
                <span className="mt-1 block text-xs font-normal text-muted-foreground">
                  Due{' '}
                  {new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(
                    new Date(`${lead.nextFollowUpDate}T00:00:00Z`),
                  )}
                </span>
              ) : null}
            </IntelligenceLine>
          </div>
        </div>
      </div>

      <div className="grid border-t border-border sm:grid-cols-3 sm:divide-x sm:divide-border">
        <div className="px-5 py-4 sm:px-6">
          <IntelligenceLine icon={UserRound} label="Primary contact">
            <span className="block">{lead.name}</span>
            <span className="block text-xs font-normal text-muted-foreground">
              {lead.email}
            </span>
          </IntelligenceLine>
        </div>
        <div className="border-t border-border px-5 py-4 sm:border-t-0 sm:px-6">
          <IntelligenceLine icon={Link2} label="Research">
            <span className="flex flex-col gap-1">
              <ExternalLink href={lead.linkedinProfileUrl}>Company LinkedIn</ExternalLink>
              <ExternalLink href={lead.focusLinkedinUrl}>Contact LinkedIn</ExternalLink>
            </span>
          </IntelligenceLine>
        </div>
        <div className="border-t border-border px-5 py-4 sm:border-t-0 sm:px-6">
          <IntelligenceLine icon={MessageCircle} label="Direct channels">
            <span className="block">{lead.phone || lead.whatsapp || 'Not captured'}</span>
          </IntelligenceLine>
        </div>
      </div>

      <div
        id="lead-record-editor"
        className={cn(
          'grid border-t border-border bg-muted/15 transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none',
          isEditing ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <form action={formAction} className="px-5 py-7 sm:px-6 sm:py-8">
            <input type="hidden" name="leadId" value={lead.id} />

            <SectionHeading
              title="Contact and account"
              description="Keep the reachable person and organization current. Provenance and ownership remain system-controlled."
            />
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field
                label="Contact name"
                name="fullName"
                error={state.errors?.fullName}
                optional={false}
              >
                <Input
                  id="fullName"
                  name="fullName"
                  autoComplete="name"
                  maxLength={120}
                  defaultValue={lead.name}
                  className={inputClassName('fullName')}
                  aria-invalid={Boolean(state.errors?.fullName)}
                  required
                />
              </Field>
              <Field
                label="Work email"
                name="email"
                error={state.errors?.email}
                optional={false}
              >
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={320}
                  defaultValue={lead.email}
                  className={inputClassName('email')}
                  aria-invalid={Boolean(state.errors?.email)}
                  required
                />
              </Field>
              <Field
                label="Company"
                name="company"
                error={state.errors?.company}
                optional={false}
              >
                <Input
                  id="company"
                  name="company"
                  autoComplete="organization"
                  maxLength={160}
                  defaultValue={lead.company}
                  className={inputClassName('company')}
                  aria-invalid={Boolean(state.errors?.company)}
                  required
                />
              </Field>
              <Field label="Industry" name="industry">
                <Input
                  id="industry"
                  name="industry"
                  maxLength={160}
                  defaultValue={lead.industry}
                  className="h-11"
                />
              </Field>
              <Field label="Phone" name="phone">
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={50}
                  defaultValue={lead.phone}
                  placeholder="+234 800 000 0000"
                  className="h-11"
                />
              </Field>
              <Field label="WhatsApp" name="whatsapp">
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  type="tel"
                  inputMode="tel"
                  maxLength={50}
                  defaultValue={lead.whatsapp}
                  className="h-11"
                />
              </Field>
              <Field label="Website" name="website" error={state.errors?.website}>
                <Input
                  id="website"
                  name="website"
                  inputMode="url"
                  maxLength={2048}
                  defaultValue={lead.website}
                  className={inputClassName('website')}
                  aria-invalid={Boolean(state.errors?.website)}
                />
              </Field>
              <Field label="Contact locale" name="locale">
                <select
                  id="locale"
                  name="locale"
                  defaultValue={lead.locale}
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <option value="en">English</option>
                  <option value="ar">Arabic</option>
                </select>
              </Field>
            </div>

            <div className="mt-9">
              <SectionHeading
                title="Problem and opportunity"
                description="Capture what is changing in the prospect’s business, the cost of the current state, and the work they may buy."
              />
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field
                  label="Opportunity or project"
                  name="projectType"
                  error={state.errors?.projectType}
                  optional={false}
                >
                  <Input
                    id="projectType"
                    name="projectType"
                    maxLength={240}
                    defaultValue={lead.projectType}
                    className={inputClassName('projectType')}
                    required
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Current systems or process" name="systemStatus">
                  <Textarea
                    id="systemStatus"
                    name="systemStatus"
                    rows={3}
                    maxLength={3000}
                    defaultValue={lead.systemStatus}
                    placeholder="How the work is handled today"
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Prospect-stated problems" name="problems">
                  <Textarea
                    id="problems"
                    name="problems"
                    rows={4}
                    maxLength={5000}
                    defaultValue={lead.problems}
                    placeholder="Use the prospect’s language where possible"
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Priority improvement" name="improveFirst">
                  <Textarea
                    id="improveFirst"
                    name="improveFirst"
                    rows={3}
                    maxLength={3000}
                    defaultValue={lead.improveFirst}
                    placeholder="What outcome matters first?"
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Additional account context" name="context">
                  <Textarea
                    id="context"
                    name="context"
                    rows={4}
                    maxLength={5000}
                    defaultValue={lead.context}
                  />
                </Field>
              </div>
            </div>

            <div className="mt-9">
              <SectionHeading
                title="Qualification"
                description="Use need, authority, budget confidence, and timing as evidence—not a box-ticking score."
              />
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="ICP category" name="icpCategory">
                <IcpCategorySelect defaultValue={lead.icpCategory} />
              </Field>
              <Field label="Decision stage" name="decisionStage">
                <Input
                  id="decisionStage"
                  name="decisionStage"
                  maxLength={500}
                  defaultValue={lead.decisionStage}
                  placeholder="Exploring, evaluating, approved"
                  className="h-11"
                />
              </Field>
              <Field label="Budget signal" name="budget">
                <Input
                  id="budget"
                  name="budget"
                  maxLength={200}
                  defaultValue={lead.budget}
                  placeholder="$25k–$45k or not established"
                  className="h-11"
                />
              </Field>
              <Field label="Buying timeline" name="timeline">
                <Input
                  id="timeline"
                  name="timeline"
                  maxLength={200}
                  defaultValue={lead.timeline}
                  placeholder="30–60 days"
                  className="h-11"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field
                  label="Qualification summary"
                  name="qualificationNotes"
                  hint="Summarize need, authority, budget confidence, timing, fit, and the evidence behind the assessment."
                >
                  <Textarea
                    id="qualificationNotes"
                    name="qualificationNotes"
                    rows={5}
                    maxLength={5000}
                    defaultValue={lead.qualificationNotes}
                  />
                </Field>
              </div>
            </div>

            <div className="mt-9">
              <SectionHeading
                title="Buying committee and research"
                description="Identify who can evaluate, champion, approve, or block the work before the opportunity stalls."
              />
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Focus contact" name="focusName">
                <Input
                  id="focusName"
                  name="focusName"
                  maxLength={120}
                  defaultValue={lead.focusName}
                  className="h-11"
                />
              </Field>
              <Field label="Role or title" name="focusTitle">
                <Input
                  id="focusTitle"
                  name="focusTitle"
                  maxLength={160}
                  defaultValue={lead.focusTitle}
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
                  maxLength={2048}
                  defaultValue={lead.linkedinProfileUrl}
                  className={inputClassName('linkedinProfileUrl')}
                />
              </Field>
              <Field
                label="Contact LinkedIn"
                name="focusLinkedinUrl"
                error={state.errors?.focusLinkedinUrl}
              >
                <Input
                  id="focusLinkedinUrl"
                  name="focusLinkedinUrl"
                  inputMode="url"
                  maxLength={2048}
                  defaultValue={lead.focusLinkedinUrl}
                  className={inputClassName('focusLinkedinUrl')}
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
                  <option value="not_connected">Not connected</option>
                  <option value="connection_sent">Connection sent</option>
                  <option value="connected">Connected</option>
                  <option value="contacted">Contacted</option>
                  <option value="replied">Replied</option>
                </select>
              </Field>
              <Field
                label="Facebook"
                name="facebookUrl"
                error={state.errors?.facebookUrl}
              >
                <Input
                  id="facebookUrl"
                  name="facebookUrl"
                  inputMode="url"
                  maxLength={2048}
                  defaultValue={lead.facebookUrl}
                  className={inputClassName('facebookUrl')}
                />
              </Field>
            </div>

            <div className="mt-9">
              <SectionHeading
                title="Engagement and next commitment"
                description="Every active conversation should finish with a clear owner, action, and date. Record outcome reasons for pipeline learning."
              />
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Last outreach date" name="lastOutreachDate">
                <Input
                  id="lastOutreachDate"
                  name="lastOutreachDate"
                  type="date"
                  defaultValue={lead.lastOutreachDate?.slice(0, 10)}
                  className="h-11"
                />
              </Field>
              <Field
                label="Next follow-up date"
                name="nextFollowUpDate"
                error={state.errors?.nextFollowUpDate}
              >
                <Input
                  id="nextFollowUpDate"
                  name="nextFollowUpDate"
                  type="date"
                  defaultValue={lead.nextFollowUpDate?.slice(0, 10)}
                  className={inputClassName('nextFollowUpDate')}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Internal next action" name="nextFollowUpAction">
                  <Input
                    id="nextFollowUpAction"
                    name="nextFollowUpAction"
                    maxLength={1000}
                    defaultValue={lead.nextFollowUpAction}
                    placeholder="Send tailored case study, then call Thursday"
                    className="h-11"
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field
                  label="Prospect-agreed next step"
                  name="nextStep"
                  hint="Use the commitment agreed with the prospect, not an internal reminder."
                >
                  <Input
                    id="nextStep"
                    name="nextStep"
                    maxLength={1000}
                    defaultValue={lead.nextStep}
                    placeholder="Discovery call with COO on 14 August"
                    className="h-11"
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Rep pain-point assessment" name="painPoints">
                  <Textarea
                    id="painPoints"
                    name="painPoints"
                    rows={4}
                    maxLength={5000}
                    defaultValue={lead.painPoints}
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field
                  label="Outcome or disqualification reason"
                  name="outcomeReason"
                  hint="Required operationally when moving a lead to Won, Lost, or Spam."
                >
                  <Textarea
                    id="outcomeReason"
                    name="outcomeReason"
                    rows={3}
                    maxLength={1000}
                    defaultValue={lead.outcomeReason}
                    placeholder="Why the opportunity closed, stalled, or was disqualified"
                  />
                </Field>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p
                className={cn(
                  'text-sm font-medium',
                  state.success ? 'text-success' : 'text-destructive',
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
