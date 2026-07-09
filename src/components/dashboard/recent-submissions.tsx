import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import { LeadScoreBadge } from '@/components/leads/lead-score-badge';
import { LeadStatusBadge } from '@/components/leads/lead-status-badge';
import { Button } from '@/components/ui/button';
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
import type { RecentSubmissionItem } from '@/lib/dashboard/types';
import { formatRelativeTime } from '@/lib/dashboard/utils';

type RecentSubmissionsProps = {
  submissions: RecentSubmissionItem[];
};

export function RecentSubmissions({ submissions }: RecentSubmissionsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Newest audit signals</CardTitle>
          <CardDescription>
            Recent lead activity ordered by intent depth and time.
          </CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/leads">View leads</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {submissions.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Audit signal</TableHead>
                <TableHead>Intent</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Received</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map(({ lead, owner, submission }) => (
                <TableRow key={submission.id}>
                  <TableCell className="min-w-48">
                    <Link
                      href={`/dashboard/leads/${lead.id}`}
                      className="group inline-flex max-w-full items-center gap-2 font-medium text-foreground hover:text-primary"
                    >
                      <span className="truncate">{lead.name}</span>
                      <ArrowUpRight
                        className="size-3.5 shrink-0 text-muted-foreground group-hover:text-primary"
                        aria-hidden="true"
                      />
                    </Link>
                    <div className="mt-1 truncate text-xs text-muted-foreground">
                      {lead.company}
                    </div>
                  </TableCell>
                  <TableCell className="min-w-52">
                    <div className="truncate text-foreground">
                      {submission.project_type}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {submission.industry_segment}
                    </div>
                  </TableCell>
                  <TableCell className="min-w-40">
                    <div className="font-medium text-foreground">
                      {submission.submission_type === 'full_audit'
                        ? 'Full audit'
                        : 'Quick-start'}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {submission.preferred_next_step}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {submission.budget_range}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {submission.timeline}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {owner?.name ?? 'Unassigned'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <LeadScoreBadge score={lead.qualification_score} />
                      <LeadStatusBadge status={lead.status} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                    {formatRelativeTime(submission.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="rounded-md border border-dashed border-border bg-muted/20 p-6 text-sm leading-6 text-muted-foreground">
            No audit submissions yet. When visitors complete quick-start or full audit
            forms, this table will show the newest sales signals.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
