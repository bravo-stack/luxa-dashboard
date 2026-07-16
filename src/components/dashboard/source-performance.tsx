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

type PerformanceTableProps = {
  title: string;
  items: SourceSummary[];
  valueLabel?: string;
};

function PerformanceTable({
  title,
  items,
  valueLabel = 'Volume',
}: PerformanceTableProps) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="min-w-0 rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source</TableHead>
            <TableHead className="w-28 text-right">{valueLabel}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length ? (
            items.map((item) => (
              <TableRow key={item.key}>
                <TableCell className="min-w-0">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-foreground">
                      {item.label}
                    </div>
                    <div className="mt-2 h-1.5 rounded-sm bg-muted">
                      <div
                        className="h-1.5 rounded-sm bg-primary"
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
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={2}
                className="h-28 text-center text-sm text-muted-foreground"
              >
                No source data for this range yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function TopSourcesTable({ items }: { items: SourceSummary[] }) {
  return <PerformanceTable title="Top sources" items={items} />;
}

export function TopPagesTable({ items }: { items: SourceSummary[] }) {
  return <PerformanceTable title="Top pages" items={items} valueLabel="Visitors" />;
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
          Route, placement, campaign, referrer, and device context from controlled event
          properties only.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <TopPagesTable items={routes} />
        <TopSourcesTable items={referrers} />
        <PerformanceTable title="Conversion placements" items={ctaSources} />
        <PerformanceTable title="Campaigns" items={campaigns} />
        <PerformanceTable title="Device category" items={devices} />
      </CardContent>
    </Card>
  );
}
