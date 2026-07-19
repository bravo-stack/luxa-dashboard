'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { useFormStatus } from 'react-dom';

import { createLead, type CreateLeadState } from '@/app/dashboard/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const initialState: CreateLeadState = { message: '' };

function Field({
  label,
  name,
  error,
  optional,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  const errorId = `${name}-error`;

  return (
    <div className="grid gap-2">
      <label
        htmlFor={name}
        className="flex items-center justify-between text-xs font-semibold"
      >
        <span>{label}</span>
        {optional ? (
          <span className="font-normal text-muted-foreground">Optional</span>
        ) : null}
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

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" disabled={pending} className="min-w-40">
      {pending ? (
        <>
          <Loader2 className="animate-spin" aria-hidden="true" />
          Creating lead
        </>
      ) : (
        <>
          Create lead
          <ArrowRight aria-hidden="true" />
        </>
      )}
    </Button>
  );
}

export function CreateLeadForm() {
  const [state, formAction] = useActionState(createLead, initialState);
  const inputClassName = (field: keyof NonNullable<CreateLeadState['errors']>) =>
    cn(
      'h-11',
      state.errors?.[field] && 'border-destructive focus-visible:ring-destructive/25',
    );

  return (
    <form action={formAction} className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="surface-premium rounded-lg p-5 sm:p-7">
        <div className="border-b border-border pb-5">
          <p className="text-sm font-semibold text-foreground">Account and opportunity</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Capture enough context for qualification. The record starts in the New stage.
          </p>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Full name" name="fullName" error={state.errors?.fullName}>
            <Input
              id="fullName"
              name="fullName"
              autoComplete="name"
              className={inputClassName('fullName')}
              aria-invalid={Boolean(state.errors?.fullName)}
              required
            />
          </Field>
          <Field label="Mail / work email" name="email" error={state.errors?.email}>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className={inputClassName('email')}
              aria-invalid={Boolean(state.errors?.email)}
              required
            />
          </Field>
          <Field label="Company name" name="company" error={state.errors?.company}>
            <Input
              id="company"
              name="company"
              autoComplete="organization"
              className={inputClassName('company')}
              aria-invalid={Boolean(state.errors?.company)}
              required
            />
          </Field>
          <Field label="ICP category" name="icpCategory" optional>
            <Input
              id="icpCategory"
              name="icpCategory"
              placeholder="Enterprise fintech"
              className="h-11"
            />
          </Field>
          <Field label="Website" name="website" error={state.errors?.website} optional>
            <Input
              id="website"
              name="website"
              type="text"
              inputMode="url"
              autoComplete="url"
              placeholder="company.com"
              className={inputClassName('website')}
              aria-invalid={Boolean(state.errors?.website)}
            />
          </Field>
          <Field
            label="Company LinkedIn"
            name="linkedinProfileUrl"
            error={state.errors?.linkedinProfileUrl}
            optional
          >
            <Input
              id="linkedinProfileUrl"
              name="linkedinProfileUrl"
              inputMode="url"
              placeholder="linkedin.com/company/acme"
              className={inputClassName('linkedinProfileUrl')}
              aria-invalid={Boolean(state.errors?.linkedinProfileUrl)}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field
              label="Opportunity or project"
              name="projectType"
              error={state.errors?.projectType}
            >
              <Input
                id="projectType"
                name="projectType"
                placeholder="Revenue operations platform"
                className={inputClassName('projectType')}
                aria-invalid={Boolean(state.errors?.projectType)}
                required
              />
            </Field>
          </div>
          <Field label="Industry" name="industry" optional>
            <Input id="industry" name="industry" className="h-11" />
          </Field>
          <Field label="Lead locale" name="locale">
            <select
              id="locale"
              name="locale"
              defaultValue="en"
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <option value="en">English</option>
              <option value="ar">Arabic</option>
            </select>
          </Field>
          <Field label="Budget signal" name="budget" optional>
            <Input id="budget" name="budget" placeholder="$25k–$45k" className="h-11" />
          </Field>
          <Field label="Timeline" name="timeline" optional>
            <Input
              id="timeline"
              name="timeline"
              placeholder="30–60 days"
              className="h-11"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Recommended next step" name="nextStep" optional>
              <Input
                id="nextStep"
                name="nextStep"
                placeholder="Send discovery brief"
                className="h-11"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Internal context" name="context" optional>
              <Textarea
                id="context"
                name="context"
                rows={5}
                placeholder="What should the sales team know before first contact?"
              />
            </Field>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <p className="text-sm font-semibold text-foreground">Focus contact</p>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Add the senior decision-maker or influential employee most likely to evaluate
            Luxa’s services.
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label="Focus name" name="focusName" optional>
              <Input
                id="focusName"
                name="focusName"
                autoComplete="name"
                className="h-11"
              />
            </Field>
            <Field label="Title" name="focusTitle" optional>
              <Input
                id="focusTitle"
                name="focusTitle"
                placeholder="Chief Operating Officer"
                className="h-11"
              />
            </Field>
            <Field
              label="Focus LinkedIn"
              name="focusLinkedinUrl"
              error={state.errors?.focusLinkedinUrl}
              optional
            >
              <Input
                id="focusLinkedinUrl"
                name="focusLinkedinUrl"
                inputMode="url"
                placeholder="linkedin.com/in/name"
                className={inputClassName('focusLinkedinUrl')}
                aria-invalid={Boolean(state.errors?.focusLinkedinUrl)}
              />
            </Field>
            <Field label="Connection status" name="connectionStatus" optional>
              <select
                id="connectionStatus"
                name="connectionStatus"
                defaultValue="not_researched"
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

        <div className="mt-8 border-t border-border pt-6">
          <p className="text-sm font-semibold text-foreground">Outreach context</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label="Last outreach date" name="lastOutreachDate" optional>
              <Input
                id="lastOutreachDate"
                name="lastOutreachDate"
                type="date"
                className="h-11"
              />
            </Field>
            <Field label="WhatsApp" name="whatsapp" optional>
              <Input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                inputMode="tel"
                placeholder="+234 800 000 0000"
                className="h-11"
              />
            </Field>
            <Field
              label="Facebook"
              name="facebookUrl"
              error={state.errors?.facebookUrl}
              optional
            >
              <Input
                id="facebookUrl"
                name="facebookUrl"
                inputMode="url"
                placeholder="facebook.com/acme"
                className={inputClassName('facebookUrl')}
                aria-invalid={Boolean(state.errors?.facebookUrl)}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Next follow-up action" name="nextFollowUpAction" optional>
                <Input
                  id="nextFollowUpAction"
                  name="nextFollowUpAction"
                  placeholder="Send a tailored operations audit"
                  className="h-11"
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Pain points" name="painPoints" optional>
                <Textarea
                  id="painPoints"
                  name="painPoints"
                  rows={4}
                  placeholder="What business friction makes this account a strong fit?"
                />
              </Field>
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Button asChild type="button" variant="ghost">
            <Link href="/dashboard/leads">Cancel</Link>
          </Button>
          <SubmitButton />
        </div>
        <p
          className="mt-3 min-h-5 text-right text-xs font-medium text-destructive"
          aria-live="polite"
        >
          {state.message}
        </p>
      </div>

      <aside className="space-y-5 xl:pt-1" aria-label="Lead creation guidance">
        <div className="border-t border-border pt-5">
          <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
          <h2 className="mt-4 text-sm font-semibold">Private CRM record</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Contact details are stored in Supabase only. They are never sent to Umami.
          </p>
        </div>
        <div className="border-t border-border pt-5">
          <CheckCircle2 className="size-5 text-success" aria-hidden="true" />
          <h2 className="mt-4 text-sm font-semibold">What happens next</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            You’ll land on the new record where status, notes, and follow-up actions are
            available.
          </p>
        </div>
      </aside>
    </form>
  );
}
