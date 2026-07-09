import { MousePointerClick, Route, Send, Smartphone, TrendingUp } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
    <div className="rounded-lg border border-border">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="flex size-8 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground">
          <Icon className="size-4" aria-hidden="true" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source</TableHead>
            <TableHead className="w-28 text-right">Volume</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.key}>
              <TableCell className="min-w-0">
                <div className="min-w-0">
                  <div className="truncate font-medium text-foreground">{item.label}</div>
                  <div className="mt-1 h-1.5 rounded-md bg-muted">
                    <div
                      className="h-1.5 rounded-md bg-primary"
                      style={{ width: `${Math.max(8, (item.value / max) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {item.context}
                  </p>
                </div>
              </TableCell>
              <TableCell className="text-right text-muted-foreground tabular-nums">
                {item.value.toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
    <Card>
      <CardHeader>
        <CardTitle>Where qualified demand is forming</CardTitle>
        <CardDescription>
          Source previews use route, CTA, campaign, referrer, and device data without
          private lead details.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <SourceColumn title="Top routes" items={routes} icon={Route} />
        <SourceColumn
          title="Top CTA sources"
          items={ctaSources}
          icon={MousePointerClick}
        />
        <SourceColumn title="Top UTM campaigns" items={campaigns} icon={Send} />
        <SourceColumn title="Top referrers" items={referrers} icon={TrendingUp} />
        <SourceColumn title="Device category" items={devices} icon={Smartphone} />
      </CardContent>
    </Card>
  );
}
