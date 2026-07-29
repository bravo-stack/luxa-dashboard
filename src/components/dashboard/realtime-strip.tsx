import { Activity, Clock3, Eye, MousePointerClick, Users } from 'lucide-react';

import type { RealtimeSummary } from '@/lib/dashboard/types';

const timeFormatter = new Intl.DateTimeFormat('en', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC',
  timeZoneName: 'short',
});

export function RealtimeStrip({ data }: { data: RealtimeSummary }) {
  const metrics = [
    { label: 'Active now', value: data.activeVisitors, icon: Activity },
    { label: '30m visitors', value: data.visitors, icon: Users },
    { label: '30m views', value: data.views, icon: Eye },
    { label: '30m events', value: data.events, icon: MousePointerClick },
  ];

  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface-premium text-foreground lg:flex-row lg:items-stretch">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4 lg:w-52 lg:border-r lg:border-b-0">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
          <span className="relative inline-flex size-2.5 rounded-full bg-success" />
        </span>
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] uppercase">Live pulse</p>
          <p className="mt-1 flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
            <Clock3 className="size-3" aria-hidden="true" />
            {timeFormatter.format(new Date(data.updatedAt))}
          </p>
        </div>
      </div>
      <div className="grid flex-1 grid-cols-2 lg:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }, index) => (
          <div
            key={label}
            className={`px-5 py-4 ${index % 2 ? 'border-l border-border' : ''} ${index > 1 ? 'border-t border-border lg:border-t-0' : ''} ${index > 0 ? 'lg:border-l' : ''}`}
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="size-3.5" aria-hidden="true" />
              <p className="text-[0.6875rem] font-semibold tracking-[0.08em] uppercase">
                {label}
              </p>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] tabular-nums">
              {value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
