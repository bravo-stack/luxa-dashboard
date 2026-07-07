'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { SourceSummary } from '@/lib/dashboard/types';
import { cn } from '@/lib/utils';

type AnalyticsChartCardProps = {
  title: string;
  description: string;
  data: SourceSummary[];
  variant?: 'area' | 'bar' | 'line';
  color?: string;
  className?: string;
  valueSuffix?: string;
};

export function AnalyticsChartCard({
  title,
  description,
  data,
  variant = 'area',
  color = 'var(--chart-1)',
  className,
  valueSuffix,
}: AnalyticsChartCardProps) {
  const chartConfig = {
    value: {
      label: title,
      color,
    },
  };
  const valueFormatter = (value: string | number) =>
    valueSuffix ? `${value}${valueSuffix}` : String(value);

  return (
    <section className={cn('surface-elevated rounded-lg p-5 sm:p-6', className)}>
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <ChartContainer config={chartConfig} className="mt-5 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {variant === 'bar' ? (
            <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <Tooltip
                cursor={{ fill: 'rgba(76, 201, 240, 0.06)' }}
                content={<ChartTooltipContent formatter={valueFormatter} />}
              />
              <Bar dataKey="value" name={title} fill={color} radius={[8, 8, 2, 2]} />
            </BarChart>
          ) : variant === 'line' ? (
            <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <Tooltip
                cursor={{ stroke: 'rgba(76, 201, 240, 0.22)' }}
                content={<ChartTooltipContent formatter={valueFormatter} />}
              />
              <Line
                type="monotone"
                dataKey="value"
                name={title}
                stroke={color}
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          ) : (
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient
                  id={`${title.replace(/\s+/g, '-')}-fill`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <Tooltip
                cursor={{ stroke: 'rgba(76, 201, 240, 0.22)' }}
                content={<ChartTooltipContent formatter={valueFormatter} />}
              />
              <Area
                type="monotone"
                dataKey="value"
                name={title}
                stroke={color}
                strokeWidth={2.5}
                fill={`url(#${title.replace(/\s+/g, '-')}-fill)`}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </ChartContainer>
    </section>
  );
}
