import { MousePointerClick, Route, Send, Smartphone, TrendingUp } from 'lucide-react';

import type { SourceSummary } from '@/lib/dashboard/types';

type SourcePerformanceProps = {
  routes: SourceSummary[];
  ctaSources: SourceSummary[];
  campaigns: SourceSummary[];
  referrers: SourceSummary[];
  devices: SourceSummary[];
};

function SourceColumn({
  title,
  items,
  icon: Icon,
}: {
  title: string;
  items: SourceSummary[];
  icon: typeof Route;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="rounded-lg border border-border bg-muted/45 p-4">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="mt-4 space-y-4">
        {items.map((item) => (
          <div key={item.key}>
            <div className="flex items-center justify-between gap-3">
              <span className="truncate text-sm font-medium text-foreground">
                {item.label}
              </span>
              <span className="font-mono text-sm text-muted-foreground">
                {item.value.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 h-1.5 rounded-md bg-muted/80">
              <div
                className="h-1.5 rounded-md bg-primary"
                style={{ width: `${Math.max(8, (item.value / max) * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{item.context}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SourcePerformance({
  routes,
  ctaSources,
  campaigns,
  referrers,
  devices,
}: SourcePerformanceProps) {
  return (
    <section className="surface-elevated rounded-lg p-5 sm:p-6">
      <div>
        <p className="text-xs font-semibold text-success uppercase">Source performance</p>
        <h2 className="mt-2 text-xl font-semibold text-foreground">
          Where qualified demand is forming
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Source previews use route, CTA, campaign, referrer, and device data without
          private lead details.
        </p>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <SourceColumn title="Top routes" items={routes} icon={Route} />
        <SourceColumn
          title="Top CTA sources"
          items={ctaSources}
          icon={MousePointerClick}
        />
        <SourceColumn title="Top UTM campaigns" items={campaigns} icon={Send} />
        <SourceColumn title="Top referrers" items={referrers} icon={TrendingUp} />
        <SourceColumn title="Device category" items={devices} icon={Smartphone} />
      </div>
    </section>
  );
}
