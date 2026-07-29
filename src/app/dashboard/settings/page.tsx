import {
  BarChart3,
  Check,
  Database,
  FileDown,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Badge } from '@/components/ui/badge';
import { getDashboardAnalytics } from '@/lib/analytics/server';
import { getLeadQueue } from '@/lib/dashboard/queries';

type ReadinessItem = {
  label: string;
  description: string;
  value: string;
  ready: boolean;
  icon: typeof Check;
};

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const [analyticsResult, leadsResult] = await Promise.allSettled([
    getDashboardAnalytics({ dateRange: '7d' }),
    getLeadQueue({ pageSize: 10 }),
  ]);
  const analytics = analyticsResult.status === 'fulfilled' ? analyticsResult.value : null;
  const leads = leadsResult.status === 'fulfilled' ? leadsResult.value : null;
  const authConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const readiness: ReadinessItem[] = [
    {
      label: 'Admin access boundary',
      description: 'Dashboard routes require an authenticated Supabase administrator.',
      value: authConfigured ? 'Configured' : 'Missing',
      ready: authConfigured,
      icon: ShieldCheck,
    },
    {
      label: 'CRM connection',
      description: 'Lead reads and mutations use the protected Supabase server client.',
      value: leads ? `${leads.total.toLocaleString()} leads reachable` : 'Unavailable',
      ready: Boolean(leads),
      icon: Database,
    },
    {
      label: 'Analytics connection',
      description:
        'Umami signals are independently fetched with partial-failure isolation.',
      value: analytics
        ? `${analytics.availability.available.length} signal groups online`
        : 'Unavailable',
      ready: Boolean(analytics),
      icon: BarChart3,
    },
    {
      label: 'Protected export',
      description: 'CSV output is authenticated, non-cacheable, and spreadsheet-safe.',
      value: 'Enabled',
      ready: true,
      icon: FileDown,
    },
  ];
  const readyCount = readiness.filter((item) => item.ready).length;

  return (
    <>
      <DashboardHeader
        eyebrow="Operations / system"
        title="Launch readiness"
        description="A live, non-sensitive view of the connections and controls the admin workspace depends on."
        meta={
          <Badge variant={readyCount === readiness.length ? 'teal' : 'warm'}>
            {readyCount}/{readiness.length} launch controls ready
          </Badge>
        }
      />

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_18px_55px_rgba(18,24,40,0.045)]">
        <div className="border-b border-border px-5 py-5">
          <p className="text-[0.6875rem] font-semibold tracking-[0.12em] text-primary uppercase">
            Connection health
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-foreground">
            Production controls
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Secret values are never rendered; only safe readiness state is shown.
          </p>
        </div>
        <div className="divide-y divide-border">
          {readiness.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.label}
                className="grid gap-4 px-5 py-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
              >
                <div
                  className={`flex size-10 items-center justify-center rounded-full border ${
                    item.ready
                      ? 'border-success/20 bg-success/10 text-success'
                      : 'border-warning/25 bg-warning/10 text-warning'
                  }`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{item.label}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <Badge variant={item.ready ? 'teal' : 'warm'} className="w-fit">
                  {item.ready ? (
                    <Check className="mr-1 size-3.5" />
                  ) : (
                    <TriangleAlert className="mr-1 size-3.5" />
                  )}
                  {item.value}
                </Badge>
              </article>
            );
          })}
        </div>
      </section>

      {analytics?.availability.unavailable.length ? (
        <section className="rounded-xl border border-warning/25 bg-warning/8 px-5 py-5">
          <div className="flex items-start gap-3">
            <TriangleAlert
              className="mt-0.5 size-5 shrink-0 text-warning"
              aria-hidden="true"
            />
            <div>
              <h2 className="font-semibold text-foreground">
                Optional analytics signals unavailable
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                The dashboard remains operational. Unavailable groups:{' '}
                {analytics.availability.unavailable.join(', ')}.
              </p>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
