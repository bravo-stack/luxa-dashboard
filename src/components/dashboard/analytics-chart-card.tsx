'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
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
import type { SourceSummary } from '@/lib/dashboard/types';
import { cn } from '@/lib/utils';

type AnalyticsChartCardProps = {
  title: string;
  description: string;
  data: SourceSummary[];
  secondaryData?: SourceSummary[];
  variant?: 'bar' | 'line';
  color?: string;
  className?: string;
  valueSuffix?: string;
};

const numberFormatter = new Intl.NumberFormat('en', {
  maximumFractionDigits: 1,
});

function formatChartValue(value: number, suffix = '') {
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
  variant = 'line',
  color = 'var(--chart-1)',
  className,
  valueSuffix,
}: AnalyticsChartCardProps) {
  const chartData = data.map((item, index) => ({
    ...item,
    primary: item.value,
    secondary: secondaryData?.[index]?.value,
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
    <Card className={cn(className)}>
      <CardHeader className="gap-4">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="grid gap-3 rounded-md border border-border bg-muted/35 p-3 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              {aggregateLabel}
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground tabular-nums">
              {formatChartValue(aggregateValue, valueSuffix)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Latest
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground tabular-nums">
              {formatChartValue(lastPoint, valueSuffix)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Change
            </p>
            <p
              className={cn(
                'mt-1 text-lg font-semibold tabular-nums',
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
      <CardContent>
        {!hasData ? (
          <div className="flex h-72 items-center justify-center rounded-md border border-dashed border-border bg-muted/25">
            <p className="text-sm font-medium text-muted-foreground">
              No chart data for this view.
            </p>
          </div>
        ) : (
          <ChartContainer
            className="h-72 w-full"
            config={{
              primary: { label: title, color },
              secondary: {
                label: 'Lead submissions',
                color: 'var(--chart-2)',
              },
            }}
          >
            {variant === 'bar' ? (
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="4 4" />
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
                  cursor={{ fill: 'var(--muted)' }}
                  content={<ChartTooltipContent valueSuffix={valueSuffix} />}
                />
                <Bar
                  dataKey="primary"
                  name={title}
                  fill="var(--color-primary)"
                  maxBarSize={42}
                  radius={[5, 5, 2, 2]}
                />
              </BarChart>
            ) : (
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="4 4" />
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
                <Line
                  type="monotone"
                  dataKey="primary"
                  name={title}
                  stroke="var(--color-primary)"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
                {secondaryData ? (
                  <Line
                    type="monotone"
                    dataKey="secondary"
                    name="Lead submissions"
                    stroke="var(--color-secondary)"
                    strokeDasharray="5 5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.25}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2 }}
                  />
                ) : null}
              </LineChart>
            )}
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
