'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

export type ChartConfig = Record<
  string,
  {
    label?: string;
    color?: string;
  }
>;

type ChartContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  config: ChartConfig;
};

function ChartContainer({
  id,
  className,
  children,
  config,
  style,
  ...props
}: ChartContainerProps) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, '')}`;
  const chartVars = Object.entries(config).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      if (value.color) {
        acc[`--color-${key}`] = value.color;
      }

      return acc;
    },
    {},
  );

  return (
    <div
      data-chart={chartId}
      className={cn(
        'flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-grid_line]:stroke-border/70 [&_.recharts-tooltip-cursor]:fill-primary/5',
        className,
      )}
      style={{ ...chartVars, ...style } as React.CSSProperties}
      {...props}
    >
      {children}
    </div>
  );
}

function ChartTooltipContent({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{
    color?: string;
    dataKey?: string | number;
    name?: string;
    value?: string | number;
  }>;
  label?: string | number;
  formatter?: (value: string | number) => string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="surface-glass min-w-36 rounded-xl p-3 text-sm shadow-xl">
      {label ? <div className="mb-2 font-semibold text-foreground">{label}</div> : null}
      <div className="space-y-1.5">
        {payload.map((item) => (
          <div
            key={`${item.dataKey ?? item.name}`}
            className="flex items-center justify-between gap-4 text-muted-foreground"
          >
            <span className="flex items-center gap-2">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.name ?? item.dataKey}
            </span>
            <span className="font-mono text-foreground">
              {formatter && item.value !== undefined ? formatter(item.value) : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export { ChartContainer, ChartTooltipContent };
