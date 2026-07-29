'use client';

import { LineChart as LineChartIcon } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import type { SourceSummary } from '@/lib/dashboard/types';
import { cn } from '@/lib/utils';

type AnalyticsChartCardProps = {
  title: string;
  description: string;
  data: SourceSummary[];
  secondaryData?: SourceSummary[];
  secondaryLabel?: string;
  variant?: 'bar' | 'line';
  color?: string;
  className?: string;
  valueSuffix?: string;
  insight?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  state?: 'loaded' | 'loading' | 'error';
};

const numberFormatter = new Intl.NumberFormat('en', {
  maximumFractionDigits: 1,
});

function formatChartValue(value: number, suffix = '') {
  if (Math.abs(value) >= 1000) {
    return `${new Intl.NumberFormat('en', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)}${suffix}`;
  }

  return `${numberFormatter.format(value)}${suffix}`;
}

function formatAxisLabel(label: string) {
  return label.length > 13 ? `${label.slice(0, 12)}...` : label;
}

export function AnalyticsChartCard({
  title,
  description,
  data,
  secondaryData,
  secondaryLabel = 'Lead submissions',
  variant = 'line',
  color = 'var(--chart-1)',
  className,
  valueSuffix,
  insight,
  emptyTitle = 'No chart data yet',
  emptyDescription = 'Once this signal starts collecting events, the trend will appear here.',
  state = 'loaded',
}: AnalyticsChartCardProps) {
  const secondaryByKey = new Map(
    secondaryData?.map((item) => [item.key, item.value]) ?? [],
  );
  const chartData = data.map((item) => ({
    ...item,
    primary: item.value,
    secondary: secondaryByKey.get(item.key),
  }));
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const aggregateValue = valueSuffix === '%' ? total / Math.max(data.length, 1) : total;
  const aggregateLabel = valueSuffix === '%' ? 'Average' : 'Total';
  const lastPoint = data.at(-1)?.value ?? 0;
  const previousPoint = data.at(-2)?.value ?? 0;
  const change = lastPoint - previousPoint;
  const changeLabel =
    change === 0
      ? 'No movement'
      : `${change > 0 ? '+' : ''}${formatChartValue(change, valueSuffix)} vs prior`;
  const hasData = data.length > 0;

  return (
    <Card
      className={cn(
        'overflow-hidden rounded-xl shadow-[0_18px_55px_rgba(18,24,40,0.045)]',
        className,
      )}
    >
      <CardHeader className="gap-6 border-b border-border pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl">
            <p className="mb-2 text-[0.6875rem] font-semibold tracking-[0.12em] text-primary uppercase">
              Trend intelligence
            </p>
            <CardTitle className="text-lg tracking-[-0.02em]">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {insight ? (
            <p className="max-w-72 border-l-2 border-primary pl-3 text-xs leading-5 text-muted-foreground">
              {insight}
            </p>
          ) : null}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[0.6875rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              {aggregateLabel}
            </p>
            <p className="mt-1 text-xl font-semibold tracking-[-0.035em] text-foreground tabular-nums">
              {formatChartValue(aggregateValue, valueSuffix)}
            </p>
          </div>
          <div className="border-l border-border pl-4">
            <p className="text-[0.6875rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              Latest
            </p>
            <p className="mt-1 text-xl font-semibold tracking-[-0.035em] text-foreground tabular-nums">
              {formatChartValue(lastPoint, valueSuffix)}
            </p>
          </div>
          <div className="border-l border-border pl-4">
            <p className="text-[0.6875rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              Momentum
            </p>
            <p
              className={cn(
                'mt-1 truncate text-sm font-semibold tabular-nums sm:text-base',
                change > 0
                  ? 'text-success'
                  : change < 0
                    ? 'text-destructive'
                    : 'text-foreground',
              )}
            >
              {changeLabel}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-5 sm:p-5 sm:pt-6">
        {state === 'loading' ? (
          <div className="h-72 rounded-md border border-border bg-muted/20 p-5">
            <Skeleton className="h-full w-full" />
          </div>
        ) : state === 'error' ? (
          <div className="flex h-72 items-center justify-center rounded-md border border-destructive/20 bg-destructive/5 p-6 text-center">
            <div>
              <LineChartIcon className="mx-auto size-5 text-destructive" />
              <p className="mt-3 text-sm font-semibold text-foreground">
                Chart unavailable
              </p>
              <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                Retry the dashboard before using this metric for decisions.
              </p>
            </div>
          </div>
        ) : !hasData ? (
          <div className="flex h-72 items-center justify-center rounded-md border border-dashed border-border bg-muted/20 p-6 text-center">
            <div>
              <LineChartIcon className="mx-auto size-5 text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold text-foreground">{emptyTitle}</p>
              <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                {emptyDescription}
              </p>
            </div>
          </div>
        ) : (
          <>
            <ul className="sr-only">
              {chartData.map((point) => (
                <li key={point.key}>
                  {point.label}: {formatChartValue(point.primary, valueSuffix)}
                  {typeof point.secondary === 'number'
                    ? `; ${secondaryLabel}: ${formatChartValue(point.secondary, valueSuffix)}`
                    : ''}
                </li>
              ))}
            </ul>
            <ChartContainer
              className="h-80 w-full"
              role="img"
              aria-label={`${title} chart`}
              config={{
                primary: { label: title, color },
                secondary: {
                  label: secondaryLabel,
                  color: 'var(--chart-2)',
                },
              }}
            >
              {variant === 'bar' ? (
                <BarChart
                  data={chartData}
                  margin={{ top: 12, right: 12, left: -4, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 5" />
                  <XAxis
                    dataKey="label"
                    tickFormatter={formatAxisLabel}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={12}
                    minTickGap={14}
                  />
                  <YAxis
                    width={42}
                    tickFormatter={(value: number) => formatChartValue(value)}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <ReferenceLine y={0} stroke="var(--border)" />
                  <Tooltip
                    cursor={{ fill: 'var(--muted)', fillOpacity: 0.55 }}
                    content={<ChartTooltipContent valueSuffix={valueSuffix} />}
                  />
                  <Bar
                    dataKey="primary"
                    name={title}
                    fill="var(--color-primary)"
                    maxBarSize={38}
                    radius={[6, 6, 2, 2]}
                    isAnimationActive={false}
                  />
                </BarChart>
              ) : (
                <AreaChart
                  data={chartData}
                  margin={{ top: 12, right: 12, left: -4, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 5" />
                  <XAxis
                    dataKey="label"
                    tickFormatter={formatAxisLabel}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={12}
                    minTickGap={14}
                  />
                  <YAxis
                    width={44}
                    tickFormatter={(value: number) => formatChartValue(value)}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <ReferenceLine y={0} stroke="var(--border)" />
                  <Tooltip
                    cursor={{ stroke: 'var(--border)' }}
                    content={<ChartTooltipContent valueSuffix={valueSuffix} />}
                  />
                  <Area
                    type="monotone"
                    dataKey="primary"
                    name={title}
                    stroke="var(--color-primary)"
                    fill="var(--color-primary)"
                    fillOpacity={0.09}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                  {secondaryData ? (
                    <Line
                      type="monotone"
                      dataKey="secondary"
                      name={secondaryLabel}
                      stroke="var(--color-secondary)"
                      strokeDasharray="5 5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.25}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                  ) : null}
                </AreaChart>
              )}
            </ChartContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}
