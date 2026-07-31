'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';
import {
  Archive,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Mail,
  MoreHorizontal,
  UserPlus,
} from 'lucide-react';

import { EmptyState } from '@/components/dashboard/empty-state';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { WorkspaceRole } from '@/lib/auth/types';
import { claimLead, persistLeadStatus } from '@/lib/dashboard/client';
import {
  type LeadListItem,
  type LeadOwnershipScope,
  type LeadPriority,
  type LeadStatus,
  leadStatuses,
} from '@/lib/dashboard/types';
import {
  formatDate,
  getIcpCategoryLabel,
  getLeadOwnershipLabel,
  originLabels,
  priorityLabels,
  statusLabels,
} from '@/lib/dashboard/utils';

import { LeadFilters, type LeadFilterState, type LeadSortKey } from './lead-filters';
import { LeadSearch } from './lead-search';
import { LeadStatusBadge } from './lead-status-badge';

type LeadTableProps = {
  leads: LeadListItem[];
  total: number;
  page: number;
  totalPages: number;
  statusCounts: Record<LeadStatus, number>;
  budgets: string[];
  timelines: string[];
  initialSearch?: string;
  initialFilters: LeadFilterState;
  initialSort: LeadSortKey;
  viewerRole: WorkspaceRole;
  currentUserId: string;
  ownershipScope: LeadOwnershipScope;
};

const priorityDotClasses: Record<LeadPriority, string> = {
  standard: 'bg-muted-foreground/45',
  review_next: 'bg-primary',
  contact_overdue: 'bg-destructive',
  high_fit: 'bg-warning',
};

function getLatestSubmission(lead: LeadListItem) {
  return lead.submissions[0];
}

function TableValue({ value }: { value?: string }) {
  if (!value?.trim()) {
    return (
      <span
        className="text-muted-foreground/55"
        title="Not captured"
        aria-label="Not captured"
      >
        —
      </span>
    );
  }

  return <span>{value}</span>;
}

export function LeadTable({
  leads,
  total,
  page,
  totalPages,
  statusCounts,
  budgets,
  timelines,
  initialSearch = '',
  initialFilters,
  initialSort,
  viewerRole,
  currentUserId,
  ownershipScope,
}: LeadTableProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rows, setRows] = React.useState(leads);
  const [search, setSearch] = React.useState(initialSearch);
  const [filters, setFilters] = React.useState<LeadFilterState>(initialFilters);
  const [sort, setSort] = React.useState<LeadSortKey>(initialSort);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    icp_category: false,
    focus_contact: false,
    connection_status: false,
    last_outreach_date: false,
    next_follow_up: true,
    timeline: false,
    origin: false,
    ownership: true,
  });
  const [mutationError, setMutationError] = React.useState('');
  const [isPending, startTransition] = React.useTransition();
  const lastAppliedSearch = React.useRef(initialSearch);

  React.useEffect(() => {
    setRows(leads);
  }, [leads]);

  React.useEffect(() => {
    lastAppliedSearch.current = initialSearch;
    setSearch(initialSearch);
    setFilters(initialFilters);
    setSort(initialSort);
  }, [initialFilters, initialSearch, initialSort]);

  const replaceQueueUrl = React.useCallback(
    (
      nextSearch: string,
      nextFilters: LeadFilterState,
      nextSort: LeadSortKey,
      nextPage = 1,
    ) => {
      const params = new URLSearchParams(searchParams.toString());
      const setOptional = (key: string, value: string, defaultValue = 'all') => {
        if (!value || value === defaultValue) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      };

      setOptional('q', nextSearch.trim(), '');
      setOptional('status', nextFilters.status);
      setOptional('budget', nextFilters.budget);
      setOptional('timeline', nextFilters.timeline);
      setOptional('origin', nextFilters.origin);
      setOptional('date', nextFilters.date);
      setOptional('sort', nextSort, 'newest');

      if (nextPage > 1) {
        params.set('page', String(nextPage));
      } else {
        params.delete('page');
      }

      const query = params.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  React.useEffect(() => {
    if (search === lastAppliedSearch.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      lastAppliedSearch.current = search;
      replaceQueueUrl(search, filters, sort);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [filters, replaceQueueUrl, search, sort]);

  function handleFiltersChange(nextFilters: LeadFilterState) {
    setFilters(nextFilters);
    replaceQueueUrl(search, nextFilters, sort);
  }

  function handleSortChange(nextSort: LeadSortKey) {
    setSort(nextSort);
    replaceQueueUrl(search, filters, nextSort);
  }

  function handleClearFilters() {
    const clearedFilters: LeadFilterState = {
      status: 'all',
      budget: 'all',
      timeline: 'all',
      origin: 'all',
      date: 'all',
    };

    setFilters(clearedFilters);
    setSort('newest');
    replaceQueueUrl(search, clearedFilters, 'newest');
  }

  function handleOwnershipScope(nextScope: LeadOwnershipScope) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextScope === 'all') params.delete('scope');
    else params.set('scope', nextScope);
    params.delete('page');
    startTransition(() => {
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  const handleStatusChange = React.useCallback(
    (leadId: string, status: LeadStatus) => {
      const previousStatus = rows.find((lead) => lead.id === leadId)?.status;

      if (!previousStatus || previousStatus === status) {
        return;
      }

      setMutationError('');
      setRows((currentRows) =>
        currentRows.map((lead) => (lead.id === leadId ? { ...lead, status } : lead)),
      );
      startTransition(async () => {
        try {
          await persistLeadStatus(leadId, status);

          router.refresh();
        } catch (error: unknown) {
          setRows((currentRows) =>
            currentRows.map((lead) =>
              lead.id === leadId ? { ...lead, status: previousStatus } : lead,
            ),
          );
          setMutationError(
            'The lead status could not be saved. Refresh the page and try again.',
          );
          console.error(error);
        }
      });
    },
    [router, rows],
  );

  const handleClaimLead = React.useCallback(
    (leadId: string) => {
      setMutationError('');
      startTransition(async () => {
        try {
          await claimLead(leadId);
          setRows((currentRows) =>
            currentRows.map((lead) =>
              lead.id === leadId ? { ...lead, owner_user_id: currentUserId } : lead,
            ),
          );
          router.refresh();
        } catch (error: unknown) {
          setMutationError(
            error instanceof Error
              ? error.message
              : 'The lead could not be claimed. Refresh and try again.',
          );
        }
      });
    },
    [currentUserId, router],
  );

  const columns = React.useMemo<ColumnDef<LeadListItem>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Lead',
        cell: ({ row }) => {
          const lead = row.original;

          return (
            <div className="min-w-56">
              <Link
                href={`/dashboard/leads/${lead.id}`}
                className="inline-flex max-w-full flex-col rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                onClick={(event) => event.stopPropagation()}
              >
                <span className="truncate font-semibold text-foreground">
                  {lead.name}
                </span>
                <span className="mt-1 truncate text-sm text-muted-foreground">
                  {lead.email}
                </span>
              </Link>
            </div>
          );
        },
      },
      {
        accessorKey: 'company',
        header: 'Company',
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.company}</span>
        ),
      },
      {
        id: 'icp_category',
        header: 'ICP segment',
        cell: ({ row }) => (
          <TableValue
            value={
              row.original.icpCategory
                ? getIcpCategoryLabel(row.original.icpCategory)
                : undefined
            }
          />
        ),
      },
      {
        id: 'focus_contact',
        header: 'Focus contact',
        cell: ({ row }) => (
          <div className="min-w-44">
            <p className="font-medium text-foreground">
              {row.original.focusName ?? 'Not identified'}
            </p>
            {row.original.focusTitle ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {row.original.focusTitle}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        id: 'connection_status',
        header: 'Connection',
        cell: ({ row }) => (
          <span className="capitalize">
            {row.original.connectionStatus?.replace(/_/g, ' ') ?? 'Not researched'}
          </span>
        ),
      },
      {
        id: 'last_outreach_date',
        header: 'Last outreach',
        cell: ({ row }) => (
          <span>
            {row.original.lastOutreachDate
              ? formatDate(row.original.lastOutreachDate)
              : 'Not contacted'}
          </span>
        ),
      },
      {
        id: 'next_follow_up',
        header: 'Next follow-up',
        cell: ({ row }) => (
          <span className="line-clamp-2 min-w-48">
            {row.original.nextFollowUpAction ?? 'No action set'}
          </span>
        ),
      },
      {
        id: 'project_type',
        header: 'Project type',
        cell: ({ row }) => (
          <TableValue value={getLatestSubmission(row.original)?.project_type} />
        ),
      },
      {
        id: 'budget',
        header: 'Budget',
        cell: ({ row }) => (
          <TableValue value={getLatestSubmission(row.original)?.budget_range} />
        ),
      },
      {
        id: 'timeline',
        header: 'Timeline',
        cell: ({ row }) => (
          <TableValue value={getLatestSubmission(row.original)?.timeline} />
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <LeadStatusBadge status={row.original.status} />,
      },
      {
        id: 'ownership',
        header: 'Ownership',
        cell: ({ row }) => {
          const lead = row.original;
          const isMine = lead.owner_user_id === currentUserId;
          const isShared = !lead.owner_user_id && lead.origin === 'website';

          return (
            <span
              className={
                isShared
                  ? 'font-semibold text-primary'
                  : 'text-sm font-medium text-foreground'
              }
            >
              {isMine ? 'Mine' : getLeadOwnershipLabel(lead)}
            </span>
          );
        },
      },
      {
        id: 'priority',
        header: 'Attention',
        cell: ({ row }) => (
          <div className="flex min-w-32 items-center gap-2.5 whitespace-nowrap">
            <span
              className={`size-2 shrink-0 rounded-full ${priorityDotClasses[row.original.priority]}`}
              aria-hidden="true"
            />
            <span className="text-xs font-semibold text-foreground">
              {priorityLabels[row.original.priority]}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'origin',
        header: 'Origin',
        cell: ({ row }) => <span>{originLabels[row.original.origin]}</span>,
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        cell: ({ row }) => <span>{formatDate(row.original.created_at)}</span>,
      },
      {
        id: 'actions',
        header: 'Actions',
        enableHiding: false,
        cell: ({ row }) => {
          const lead = row.original;
          const canEditLead =
            viewerRole === 'admin' || lead.owner_user_id === currentUserId;
          const canClaimLead =
            viewerRole === 'sales_exec' &&
            !lead.owner_user_id &&
            lead.origin === 'website';

          return (
            <div onClick={(event) => event.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Open actions for ${lead.name}`}
                    disabled={isPending}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Lead actions</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/leads/${lead.id}`}>Open lead</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      navigator.clipboard
                        .writeText(lead.email)
                        .catch((error: unknown) => console.error(error));
                    }}
                  >
                    Copy email
                  </DropdownMenuItem>
                  {canClaimLead ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => handleClaimLead(lead.id)}>
                        <UserPlus className="size-4" />
                        Claim lead
                      </DropdownMenuItem>
                    </>
                  ) : null}
                  {canEditLead ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Status</DropdownMenuLabel>
                      {leadStatuses
                        .filter((status) =>
                          ['new', 'contacted', 'qualified'].includes(status),
                        )
                        .map((status) => (
                          <DropdownMenuItem
                            key={status}
                            onSelect={() => handleStatusChange(lead.id, status)}
                          >
                            {statusLabels[status]}
                          </DropdownMenuItem>
                        ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/leads/${lead.id}`}>
                          <Archive className="size-4" />
                          Review and mark spam
                        </Link>
                      </DropdownMenuItem>
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [currentUserId, handleClaimLead, handleStatusChange, isPending, viewerRole],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns,
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });
  const allLeadCount = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

  return (
    <section
      className="space-y-4"
      aria-label="Lead operating queue"
      aria-busy={isPending}
    >
      {viewerRole === 'sales_exec' ? (
        <div className="overflow-x-auto rounded-xl border border-border bg-card p-1.5">
          <div
            className="flex min-w-max items-center gap-1"
            aria-label="Lead ownership view"
          >
            {(
              [
                ['all', 'All available'],
                ['mine', 'My leads'],
                ['shared', 'Shared funnel'],
              ] as const
            ).map(([scope, label]) => (
              <Button
                key={scope}
                type="button"
                variant={ownershipScope === scope ? 'secondary' : 'ghost'}
                size="sm"
                disabled={isPending}
                onClick={() => handleOwnershipScope(scope)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="flex flex-col gap-3 xl:flex-row">
        <LeadSearch value={search} onValueChange={setSearch} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" className="h-11 rounded-lg">
              <Columns3 className="size-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
                >
                  {column.id.replace(/_/g, ' ')}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card p-1.5">
        <div className="flex min-w-max items-center gap-1">
          {(['all', ...leadStatuses] as const).map((status) => {
            const active = filters.status === status;

            return (
              <Button
                key={status}
                type="button"
                variant={active ? 'secondary' : 'ghost'}
                size="sm"
                className={active ? 'text-foreground' : undefined}
                disabled={isPending}
                onClick={() => handleFiltersChange({ ...filters, status })}
              >
                {status === 'all' ? 'All leads' : statusLabels[status]}
                <span
                  className={`rounded-sm px-1.5 py-0.5 font-mono text-[0.625rem] ${
                    active
                      ? 'bg-background text-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {status === 'all' ? allLeadCount : statusCounts[status]}
                </span>
              </Button>
            );
          })}
        </div>
      </div>
      <LeadFilters
        filters={filters}
        sort={sort}
        budgets={budgets}
        timelines={timelines}
        onFiltersChange={handleFiltersChange}
        onSortChange={handleSortChange}
        onClear={handleClearFilters}
        disabled={isPending}
      />
      <p
        role="status"
        aria-live="polite"
        className="min-h-5 text-xs font-medium text-muted-foreground"
      >
        {isPending
          ? 'Updating the lead queue…'
          : 'Search and filters apply across the complete lead database.'}
      </p>
      {mutationError ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm font-medium text-destructive"
        >
          {mutationError}
        </p>
      ) : null}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-[0_18px_55px_rgba(18,24,40,0.035)] lg:block">
        {table.getRowModel().rows.length ? (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-primary/4"
                  onClick={() => router.push(`/dashboard/leads/${row.original.id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            icon={Archive}
            title="No leads match this view"
            description="Adjust the filters or search query to bring the lead queue back into focus."
            className="m-5"
          />
        )}
      </div>
      <div className="grid gap-3 lg:hidden">
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => {
            const lead = row.original;
            const submission = getLatestSubmission(lead);
            const canClaimThisLead =
              viewerRole === 'sales_exec' &&
              !lead.owner_user_id &&
              lead.origin === 'website';

            return (
              <article
                key={lead.id}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_10px_35px_rgba(18,24,40,0.04)]"
              >
                <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-4">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/leads/${lead.id}`}
                      className="group inline-flex max-w-full items-center gap-2 font-semibold text-foreground"
                    >
                      <span className="truncate">{lead.name}</span>
                      <ArrowUpRight
                        className="size-3.5 shrink-0 text-muted-foreground group-hover:text-primary"
                        aria-hidden="true"
                      />
                    </Link>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {lead.company}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-primary">
                      {lead.owner_user_id === currentUserId
                        ? 'Mine'
                        : getLeadOwnershipLabel(lead)}
                    </p>
                  </div>
                  <LeadStatusBadge status={lead.status} />
                </div>
                <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
                  <div className="px-4 py-3">
                    <p className="text-[0.625rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                      Opportunity
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm font-medium text-foreground">
                      {submission?.project_type || 'Not captured'}
                    </p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-[0.625rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                      Next action
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm font-medium text-foreground">
                      {lead.nextFollowUpAction || 'No action set'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-2 rounded-full ${priorityDotClasses[lead.priority]}`}
                      aria-hidden="true"
                    />
                    <span className="text-xs font-semibold text-muted-foreground">
                      {priorityLabels[lead.priority]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button asChild variant="ghost" size="icon">
                      <a href={`mailto:${lead.email}`} aria-label={`Email ${lead.name}`}>
                        <Mail className="size-4" />
                      </a>
                    </Button>
                    {canClaimThisLead ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleClaimLead(lead.id)}
                      >
                        <UserPlus aria-hidden="true" />
                        Claim
                      </Button>
                    ) : null}
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/dashboard/leads/${lead.id}`}>Open lead</Link>
                    </Button>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <EmptyState
            icon={Archive}
            title="No leads match this view"
            description="Adjust the filters or search query to bring the lead queue back into focus."
          />
        )}
      </div>
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/45 p-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing{' '}
          <span className="font-mono text-foreground">
            {table.getRowModel().rows.length}
          </span>{' '}
          of <span className="font-mono text-foreground">{total}</span> leads
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => replaceQueueUrl(search, filters, sort, Math.max(1, page - 1))}
            disabled={page <= 1 || isPending}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <span className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              replaceQueueUrl(search, filters, sort, Math.min(totalPages, page + 1))
            }
            disabled={page >= totalPages || isPending}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
