import type { CampaignMetrics } from '@/lib/marketing/types';

export function CampaignMetricsStrip({
  metrics,
  activeCampaigns,
}: {
  metrics: CampaignMetrics;
  activeCampaigns?: number;
}) {
  const items = [
    ...(activeCampaigns === undefined
      ? []
      : [{ label: 'Active campaigns', value: activeCampaigns, note: 'Publishing now' }]),
    {
      label: 'Redirect requests',
      value: metrics.redirectRequests,
      note: 'Includes scanners',
    },
    {
      label: 'Tracked arrivals',
      value: metrics.trackedArrivals,
      note: 'Loaded audit sessions',
    },
    { label: 'Audit starts', value: metrics.auditStarts, note: 'Form intent' },
    { label: 'Submitted', value: metrics.submittedAudits, note: 'Canonical leads' },
    { label: 'Qualified+', value: metrics.qualified, note: 'Qualified or won' },
    { label: 'Won', value: metrics.won, note: 'CRM outcome' },
  ];

  return (
    <section
      className="overflow-hidden rounded-xl border border-border bg-card"
      aria-label="Campaign performance summary"
    >
      <dl className="grid grid-cols-2 divide-x divide-y divide-border md:grid-cols-4 xl:grid-cols-7 xl:divide-y-0">
        {items.map((item) => (
          <div key={item.label} className="min-w-0 px-4 py-4">
            <dt className="text-[0.65rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              {item.label}
            </dt>
            <dd className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-foreground tabular-nums">
              {item.value.toLocaleString()}
            </dd>
            <p className="mt-1 text-[0.6875rem] text-muted-foreground">{item.note}</p>
          </div>
        ))}
      </dl>
    </section>
  );
}
