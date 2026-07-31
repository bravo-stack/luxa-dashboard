import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3, ShieldX } from 'lucide-react';

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { LeadDeletionReviewList } from '@/components/leads/lead-deletion-review-list';
import { Button } from '@/components/ui/button';
import { getWorkspaceUser } from '@/lib/auth/workspace';
import { getLeadDeletionRequestOverview } from '@/lib/dashboard/lead-deletion';
import type { LeadDeletionRequestStatus } from '@/lib/dashboard/types';

export const dynamic = 'force-dynamic';

export default async function LeadDeletionRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const [user, params] = await Promise.all([getWorkspaceUser(), searchParams]);

  if (!user || user.role !== 'admin') notFound();
  const status: LeadDeletionRequestStatus | 'all' = [
    'pending',
    'approved',
    'rejected',
    'all',
  ].includes(params.status ?? '')
    ? (params.status as LeadDeletionRequestStatus | 'all')
    : 'pending';
  const overview = await getLeadDeletionRequestOverview('all');
  const items =
    status === 'all'
      ? overview.items
      : overview.items.filter((item) => item.status === status);
  const counts = overview.counts;

  return (
    <>
      <DashboardHeader
        eyebrow="Data governance"
        title="Lead deletion review"
        description="Review requested permanent removals with the original lead identity, business reason, requester, and final decision preserved as an audit record."
        actions={
          <Button asChild variant="outline">
            <Link href="/dashboard/leads">
              <ArrowLeft aria-hidden="true" />
              Back to leads
            </Link>
          </Button>
        }
      />

      {!overview.dataReady ? (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-5 py-4">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Deletion review storage is not ready
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Apply the shared lead operations migration before accepting requests.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <section>
        <div className="mb-5 overflow-x-auto rounded-xl border border-border bg-card p-1.5">
          <div className="flex min-w-max items-center gap-1">
            {(
              [
                ['pending', 'Pending', Clock3],
                ['approved', 'Approved', CheckCircle2],
                ['rejected', 'Rejected', ShieldX],
                ['all', 'All requests', AlertTriangle],
              ] as const
            ).map(([value, label, Icon]) => (
              <Button
                key={value}
                asChild
                variant={status === value ? 'secondary' : 'ghost'}
                size="sm"
              >
                <Link
                  href={
                    value === 'pending'
                      ? '/dashboard/leads/deletion-requests'
                      : `/dashboard/leads/deletion-requests?status=${value}`
                  }
                >
                  <Icon aria-hidden="true" />
                  {label}
                  <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[0.625rem] text-muted-foreground">
                    {counts[value]}
                  </span>
                </Link>
              </Button>
            ))}
          </div>
        </div>
        <LeadDeletionReviewList requests={items} canManage={overview.dataReady} />
      </section>
    </>
  );
}
