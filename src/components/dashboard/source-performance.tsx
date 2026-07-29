import type { SourceSummary } from '@/lib/dashboard/types';
import { cn } from '@/lib/utils';

type SourcePerformanceProps = {
  routes: SourceSummary[];
  ctaSources: SourceSummary[];
  campaigns: SourceSummary[];
  referrers: SourceSummary[];
  devices: SourceSummary[];
  title?: string;
  description?: string;
  labels?: [string, string, string, string, string];
};

type PerformanceListProps = {
  title: string;
  items: SourceSummary[];
  className?: string;
};

function PerformanceList({ title, items, className }: PerformanceListProps) {
  const visibleItems = items.slice(0, 5);
  const max = Math.max(...visibleItems.map((item) => item.value), 1);

  return (
    <section className={cn('min-w-0 px-5 py-5', className)}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-[0.625rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
          Volume
        </span>
      </div>
      <ol className="mt-5 space-y-4">
        {visibleItems.length ? (
          visibleItems.map((item, index) => (
            <li key={item.key} className="grid grid-cols-[18px_minmax(0,1fr)_auto] gap-2">
              <span className="pt-0.5 text-[0.625rem] text-muted-foreground tabular-nums">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-foreground">
                  {item.label}
                </p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(5, (item.value / max) * 100)}%` }}
                  />
                </div>
              </div>
              <span className="text-xs font-semibold text-foreground tabular-nums">
                {item.value.toLocaleString()}
              </span>
            </li>
          ))
        ) : (
          <li className="flex h-36 items-center justify-center text-center text-xs leading-5 text-muted-foreground">
            No signal in this range.
          </li>
        )}
      </ol>
    </section>
  );
}

export function TopSourcesTable({ items }: { items: SourceSummary[] }) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <PerformanceList title="Top sources" items={items} />
    </div>
  );
}

export function TopPagesTable({ items }: { items: SourceSummary[] }) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <PerformanceList title="Top pages" items={items} />
    </div>
  );
}

export function SourcePerformance({
  routes,
  ctaSources,
  campaigns,
  referrers,
  devices,
  title = 'Acquisition signal matrix',
  description = 'The pages, sources, campaigns, placements, and devices concentrating attention.',
  labels = ['Pages', 'Referrers', 'Campaigns', 'Conversion placement', 'Devices'],
}: SourcePerformanceProps) {
  const groups = [
    { title: labels[0], items: routes },
    { title: labels[1], items: referrers },
    { title: labels[2], items: campaigns },
    { title: labels[3], items: ctaSources },
    { title: labels[4], items: devices },
  ];

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-5">
        <p className="text-[0.6875rem] font-semibold tracking-[0.12em] text-primary uppercase">
          Distribution
        </p>
        <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-foreground">
          {title}
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="grid divide-y divide-border md:grid-cols-2 md:divide-y-0 xl:grid-cols-5">
        {groups.map((group, index) => (
          <PerformanceList
            key={group.title}
            title={group.title}
            items={group.items}
            className={cn(
              index > 0 && 'md:border-l md:border-border',
              index > 1 && 'md:border-t xl:border-t-0',
              index === 2 && 'md:border-l-0 xl:border-l',
              index === 4 && 'md:col-span-2 xl:col-span-1',
            )}
          />
        ))}
      </div>
    </section>
  );
}
