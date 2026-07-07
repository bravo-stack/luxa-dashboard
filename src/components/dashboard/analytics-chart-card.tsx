'use client';

import {
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

import type { SourceSummary } from '@/lib/dashboard/types';
import { cn } from '@/lib/utils';

type AnalyticsChartCardProps = {
  title: string;
  description: string;
  data: SourceSummary[];
  variant?: 'bar' | 'line';
  color?: string;
  className?: string;
  valueSuffix?: string;
};

export function AnalyticsChartCard({
  title,
  description,
  data,
  variant = 'line',
  color = 'var(--chart-1)',
  className,
  valueSuffix,
}: AnalyticsChartCardProps) {
  const valueFormatter = (value: string | number) =>
    valueSuffix ? `${value}${valueSuffix}` : String(value);

  return (
    <section className={cn('surface-elevated rounded-lg p-5 sm:p-6', className)}>
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="mt-5 h-64 w-full text-xs">
        <ResponsiveContainer width="100%" height="100%">
          {variant === 'bar' ? (
            <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <Tooltip
                cursor={{ fill: 'var(--muted)' }}
                formatter={(value) => valueFormatter(value as string | number)}
              />
              <Bar dataKey="value" name={title} fill={color} radius={6} />
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <Tooltip
                cursor={{ stroke: 'var(--border)' }}
                formatter={(value) => valueFormatter(value as string | number)}
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
          )}
        </ResponsiveContainer>
      </div>
    </section>
  );
}
