'use client';

import * as React from 'react';
import * as RechartsPrimitive from 'recharts';

import { cn } from '@/lib/utils';

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    color?: string;
  }
>;

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error('useChart must be used within a ChartContainer');
  }

  return context;
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config: ChartConfig;
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >['children'];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const chartId = React.useId();
  const chartClassName = `chart-${id ?? chartId.replace(/:/g, '')}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        ref={ref}
        data-chart={chartClassName}
        className={cn(
          'flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-tooltip-cursor]:fill-muted',
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartClassName} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = 'ChartContainer';

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorConfig = Object.entries(config).filter(([, item]) => item.color);

  if (!colorConfig.length) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: colorConfig
          .map(([key, item]) => `[data-chart=${id}] { --color-${key}: ${item.color}; }`)
          .join('\n'),
      }}
    />
  );
}

const ChartTooltip = RechartsPrimitive.Tooltip;

type ChartTooltipPayloadItem = {
  dataKey?: string | number;
  name?: string | number;
  value?: string | number;
};

type ChartTooltipContentProps = {
  active?: boolean;
  payload?: ChartTooltipPayloadItem[];
  label?: React.ReactNode;
  className?: string;
  valueSuffix?: string;
};

const compactNumberFormatter = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

function formatTooltipValue(value: string | number | undefined, suffix = '') {
  if (typeof value === 'number') {
    return `${compactNumberFormatter.format(value)}${suffix}`;
  }

  return `${value ?? ''}${suffix}`;
}

function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  valueSuffix,
}: ChartTooltipContentProps) {
  const { config } = useChart();

  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        'min-w-32 rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground',
        className,
      )}
    >
      <div className="font-medium text-foreground">{label}</div>
      <div className="mt-1.5 space-y-1">
        {payload.map((item) => {
          const key = String(item.dataKey ?? item.name);
          const label = config[key]?.label ?? item.name ?? key;

          return (
            <div key={key} className="flex items-center justify-between gap-6">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-semibold text-foreground">
                {formatTooltipValue(item.value, valueSuffix)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { ChartContainer, ChartTooltip, ChartTooltipContent };
