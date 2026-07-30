import Link from 'next/link';
import {
  ArrowRight,
  BookOpenCheck,
  CalendarCheck2,
  CheckCircle2,
  CircleDot,
  ShieldCheck,
  Target,
  UsersRound,
} from 'lucide-react';

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { LeadStatusBadge } from '@/components/leads/lead-status-badge';
import { Button } from '@/components/ui/button';
import { leadStatusDefinitions } from '@/lib/sales/playbook';

const sections = [
  ['daily-rhythm', 'Daily rhythm'],
  ['lead-statuses', 'Lead statuses'],
  ['qualification', 'Qualification'],
  ['record-quality', 'Record quality'],
  ['follow-up', 'Follow-up'],
  ['outcomes', 'Outcomes'],
  ['security-feedback', 'Security and feedback'],
] as const;

const qualificationSignals = [
  {
    title: 'Need and fit',
    description:
      'What business problem is changing, why it matters now, and whether Luxa is equipped to deliver a useful outcome.',
  },
  {
    title: 'People and authority',
    description:
      'Who evaluates, champions, approves, pays, or can block the decision. A title alone is not evidence of authority.',
  },
  {
    title: 'Budget confidence',
    description:
      'The available range, funding path, or commercial constraint and how confidently it was established.',
  },
  {
    title: 'Priority and timing',
    description:
      'The business trigger, target date, consequences of delay, and whether the next step is genuinely scheduled.',
  },
] as const;

const dailySteps = [
  'Start with overdue and due-today follow-ups before opening new work.',
  'Review new leads for fit, ownership, contact accuracy, and the best first action.',
  'Complete outreach in focused blocks and log what happened while context is fresh.',
  'End every active conversation with a named owner, concrete action, and date.',
  'Close stale motions honestly as Lost or Spam, with a useful outcome reason.',
] as const;

export default function SalesGuidePage() {
  return (
    <>
      <DashboardHeader
        eyebrow="Sales playbook"
        title="A practical guide to running the lead workspace"
        description="A shared operating language for non-technical teams: what to update, how to qualify, when to move a status, and what a useful next step looks like."
        actions={
          <Button asChild>
            <Link href="/dashboard/leads">
              Open lead workspace
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      <div className="grid items-start gap-8 xl:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="surface-elevated rounded-lg p-4 xl:sticky xl:top-24">
          <div className="flex items-center gap-3 border-b border-border px-2 pb-4">
            <BookOpenCheck className="size-4 text-primary" aria-hidden="true" />
            <p className="text-xs font-semibold tracking-[0.1em] text-foreground uppercase">
              On this page
            </p>
          </div>
          <nav className="mt-2 grid" aria-label="Sales guide sections">
            {sections.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="rounded-md px-2 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </nav>
        </aside>

        <article className="min-w-0 space-y-12">
          <section id="daily-rhythm" className="scroll-mt-24">
            <div className="flex items-center gap-3">
              <CalendarCheck2 className="size-5 text-primary" aria-hidden="true" />
              <h2 className="text-2xl font-semibold tracking-[-0.025em] text-foreground">
                Daily operating rhythm
              </h2>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
              The workspace is most useful when it represents reality. Prioritize
              commitments already made to prospects, then create new activity.
            </p>
            <ol className="mt-6 overflow-hidden rounded-lg border border-border bg-background">
              {dailySteps.map((step, index) => (
                <li
                  key={step}
                  className="flex gap-4 border-b border-border p-5 last:border-b-0"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {index + 1}
                  </span>
                  <p className="pt-0.5 text-sm leading-6 text-foreground">{step}</p>
                </li>
              ))}
            </ol>
          </section>

          <section id="lead-statuses" className="scroll-mt-24">
            <div className="flex items-center gap-3">
              <CircleDot className="size-5 text-primary" aria-hidden="true" />
              <h2 className="text-2xl font-semibold tracking-[-0.025em] text-foreground">
                Lead statuses
              </h2>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
              A status is a shared operational fact, not a measure of effort. Use the
              narrowest definition below so reporting remains trustworthy.
            </p>
            <div className="mt-6 divide-y divide-border overflow-hidden rounded-lg border border-border bg-background">
              {leadStatusDefinitions.map((definition) => (
                <section
                  key={definition.status}
                  className="grid gap-5 p-5 md:grid-cols-[9rem_minmax(0,1fr)] md:p-6"
                >
                  <div>
                    <LeadStatusBadge status={definition.status} />
                    <p className="mt-3 text-xs leading-5 text-muted-foreground">
                      {definition.summary}
                    </p>
                  </div>
                  <dl className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <dt className="text-xs font-semibold text-foreground">Use when</dt>
                      <dd className="mt-1.5 text-sm leading-6 text-muted-foreground">
                        {definition.useWhen}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-foreground">Do next</dt>
                      <dd className="mt-1.5 text-sm leading-6 text-muted-foreground">
                        {definition.nextAction}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-foreground">
                        Exit criteria
                      </dt>
                      <dd className="mt-1.5 text-sm leading-6 text-muted-foreground">
                        {definition.exitCriteria}
                      </dd>
                    </div>
                  </dl>
                </section>
              ))}
            </div>
          </section>

          <section id="qualification" className="scroll-mt-24">
            <div className="flex items-center gap-3">
              <Target className="size-5 text-primary" aria-hidden="true" />
              <h2 className="text-2xl font-semibold tracking-[-0.025em] text-foreground">
                Qualification without box-ticking
              </h2>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
              Qualification should explain why the team should invest more time. Capture
              evidence and uncertainty; do not invent certainty to move a pipeline stage.
            </p>
            <div className="mt-6 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
              {qualificationSignals.map((signal) => (
                <div key={signal.title} className="bg-background p-5">
                  <h3 className="text-sm font-semibold text-foreground">
                    {signal.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {signal.description}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-5 border-l-2 border-primary bg-primary/5 px-5 py-4">
              <p className="text-sm leading-6 text-foreground">
                <span className="font-semibold">Good qualification note:</span> “COO owns
                the decision; manual dispatch creates 12 hours of weekly rework; finance
                is validating a $30k range; technical discovery with Ops and IT is booked
                for 14 August.”
              </p>
            </div>
          </section>

          <section id="record-quality" className="scroll-mt-24">
            <div className="flex items-center gap-3">
              <UsersRound className="size-5 text-primary" aria-hidden="true" />
              <h2 className="text-2xl font-semibold tracking-[-0.025em] text-foreground">
                What a useful lead record contains
              </h2>
            </div>
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {[
                [
                  'Contact and account',
                  'A reachable person, accurate organization, direct channels, industry, and current links. Keep system provenance and ownership unchanged.',
                ],
                [
                  'Problem and opportunity',
                  'The current process, prospect-stated problem, desired business outcome, and the work they may buy.',
                ],
                [
                  'Buying committee',
                  'The champion, evaluator, approver, economic buyer, and potential blocker where known.',
                ],
                [
                  'Engagement plan',
                  'Last outreach, internal action, prospect-agreed next step, owner, and date. Separate facts from rep assumptions.',
                ],
              ].map(([title, description]) => (
                <div key={title} className="surface-elevated rounded-lg p-5">
                  <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
                  <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section id="follow-up" className="scroll-mt-24">
            <div className="flex items-center gap-3">
              <CalendarCheck2 className="size-5 text-primary" aria-hidden="true" />
              <h2 className="text-2xl font-semibold tracking-[-0.025em] text-foreground">
                Follow-up that earns the next conversation
              </h2>
            </div>
            <div className="mt-5 max-w-3xl space-y-4 text-sm leading-7 text-muted-foreground">
              <p>
                Follow up promptly after a meeting with a concise recap: the problem,
                decisions, open questions, and the agreed next step. Put the date in the
                record, not only in a personal calendar.
              </p>
              <p>
                A useful next step is mutual and observable: “30-minute workflow review
                with COO and operations lead on Thursday.” “Check in later” is an internal
                intention, not a prospect commitment.
              </p>
              <p>
                If a cadence ends without engagement, decide whether the opportunity is
                still active. Do not leave dormant leads in Contacted indefinitely.
              </p>
            </div>
          </section>

          <section id="outcomes" className="scroll-mt-24">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-5 text-primary" aria-hidden="true" />
              <h2 className="text-2xl font-semibold tracking-[-0.025em] text-foreground">
                Outcomes and data hygiene
              </h2>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
              When closing Won, Lost, or Spam, add an outcome reason specific enough to
              learn from. Prefer “budget redirected to compliance until Q1” over “not
              interested.” Never place passwords, payment details, or unnecessary
              sensitive personal information in lead notes.
            </p>
          </section>

          <section id="security-feedback" className="scroll-mt-24">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
              <h2 className="text-2xl font-semibold tracking-[-0.025em] text-foreground">
                Security and product feedback
              </h2>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
              Use a unique workspace password and report an unexpected session or access
              problem immediately. Use Feedback for reproducible bugs and focused feature
              requests; include the page, impact on work, what happened, and the expected
              result.
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link href="/dashboard/feedback">Submit workspace feedback</Link>
            </Button>
          </section>

          <section className="border-t border-border pt-8">
            <h2 className="text-sm font-semibold text-foreground">
              Sources and further reading
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              This playbook adapts established CRM and qualification practices to Luxa’s
              lightweight operating model. It is guidance, not a rigid sales methodology.
            </p>
            <ul className="mt-4 grid gap-2 text-sm">
              <li>
                <a
                  href="https://help.salesforce.com/s/articleView?id=sales.sales_job_landing_find_and_qualify_leads.htm&language=en_US&type=5"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Salesforce: Finding and qualifying leads
                </a>
              </li>
              <li>
                <a
                  href="https://trailhead.salesforce.com/content/learn/modules/build-a-sales-process/learn-about-the-sales-process"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Salesforce Trailhead: Optimize the sales process
                </a>
              </li>
              <li>
                <a
                  href="https://trailhead.salesforce.com/content/learn/modules/lead-generation-for-marketers/manage-leads"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Salesforce Trailhead: Lead management strategies
                </a>
              </li>
            </ul>
          </section>
        </article>
      </div>
    </>
  );
}
