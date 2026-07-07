'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Columns3,
  MoreHorizontal,
} from 'lucide-react';

import { archiveLead, updateLeadStatus } from '@/app/dashboard/actions';
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
import { dashboardNow } from '@/lib/dashboard/mock-data';
import { type LeadListItem, type LeadStatus, leadStatuses } from '@/lib/dashboard/types';
import { formatDate, formatRelativeTime, statusLabels } from '@/lib/dashboard/utils';

import {
  defaultLeadFilters,
  LeadFilters,
  type LeadFilterState,
  type LeadSortKey,
} from './lead-filters';
import { LeadScoreBadge } from './lead-score-badge';
import { LeadSearch } from './lead-search';
import { LeadStatusBadge } from './lead-status-badge';
import { PriorityBadge } from './priority-badge';

type LeadTableProps = {
  leads: LeadListItem[];
};

function getLatestSubmission(lead: LeadListItem) {
  return lead.submissions[0];
}

function matchesDateFilter(lead: LeadListItem, dateFilter: string) {
  if (dateFilter === 'all') {
    return true;
  }

  const createdAt = new Date(lead.created_at).getTime();
  const now = new Date(dashboardNow).getTime();
  const ageInDays = (now - createdAt) / (1000 * 60 * 60 * 24);

  if (dateFilter === 'today') {
    return ageInDays < 1;
  }

  if (dateFilter === '7d') {
    return ageInDays <= 7;
  }

  return ageInDays > 7;
}

function sortLeads(leads: LeadListItem[], sort: LeadSortKey) {
  return leads.slice().sort((first, second) => {
    if (sort === 'oldest') {
      return new Date(first.created_at).getTime() - new Date(second.created_at).getTime();
    }

    if (sort === 'highest_score') {
      return second.qualification_score - first.qualification_score;
    }

    if (sort === 'last_contacted') {
      const firstContacted = first.last_contacted_at
        ? new Date(first.last_contacted_at).getTime()
        : 0;
      const secondContacted = second.last_contacted_at
        ? new Date(second.last_contacted_at).getTime()
        : 0;

      return secondContacted - firstContacted;
    }

    return new Date(second.created_at).getTime() - new Date(first.created_at).getTime();
  });
}

export function LeadTable({ leads }: LeadTableProps) {
  const router = useRouter();
  const [rows, setRows] = React.useState(leads);
  const [search, setSearch] = React.useState('');
  const [filters, setFilters] = React.useState<LeadFilterState>(defaultLeadFilters);
  const [sort, setSort] = React.useState<LeadSortKey>('newest');
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [isPending, startTransition] = React.useTransition();

  const budgets = React.useMemo(
    () =>
      Array.from(
        new Set(
          rows.map((lead) => getLatestSubmission(lead)?.budget_range).filter(Boolean),
        ),
      ).sort() as string[],
    [rows],
  );
  const timelines = React.useMemo(
    () =>
      Array.from(
        new Set(rows.map((lead) => getLatestSubmission(lead)?.timeline).filter(Boolean)),
      ).sort() as string[],
    [rows],
  );
  const sources = React.useMemo(
    () => Array.from(new Set(rows.map((lead) => lead.source))).sort(),
    [rows],
  );
  const owners = React.useMemo(
    () =>
      Array.from(
        new Map(
          rows
            .filter((lead) => lead.owner)
            .map((lead) => [
              lead.owner?.id ?? '',
              { value: lead.owner?.id ?? '', label: lead.owner?.name ?? '' },
            ]),
        ).values(),
      ).filter((owner) => owner.value),
    [rows],
  );

  const filteredRows = React.useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return sortLeads(
      rows.filter((lead) => {
        const latestSubmission = getLatestSubmission(lead);
        const searchable = [
          lead.name,
          lead.email,
          lead.company,
          lead.website ?? '',
          lead.source,
          latestSubmission?.project_type ?? '',
        ]
          .join(' ')
          .toLowerCase();

        if (searchValue && !searchable.includes(searchValue)) {
          return false;
        }

        if (filters.status !== 'all' && lead.status !== filters.status) {
          return false;
        }

        if (
          filters.budget !== 'all' &&
          latestSubmission?.budget_range !== filters.budget
        ) {
          return false;
        }

        if (
          filters.timeline !== 'all' &&
          latestSubmission?.timeline !== filters.timeline
        ) {
          return false;
        }

        if (filters.source !== 'all' && lead.source !== filters.source) {
          return false;
        }

        if (filters.owner === 'unassigned' && lead.owner_user_id) {
          return false;
        }

        if (
          filters.owner !== 'all' &&
          filters.owner !== 'unassigned' &&
          lead.owner_user_id !== filters.owner
        ) {
          return false;
        }

        return matchesDateFilter(lead, filters.date);
      }),
      sort,
    );
  }, [filters, rows, search, sort]);

  const handleStatusChange = React.useCallback((leadId: string, status: LeadStatus) => {
    setRows((currentRows) =>
      currentRows.map((lead) => (lead.id === leadId ? { ...lead, status } : lead)),
    );
    startTransition(() => {
      updateLeadStatus(leadId, status).catch((error: unknown) => {
        console.error(error);
      });
    });
  }, []);

  const handleArchiveLead = React.useCallback((leadId: string) => {
    setRows((currentRows) =>
      currentRows.map((lead) =>
        lead.id === leadId ? { ...lead, status: 'archived' } : lead,
      ),
    );
    startTransition(() => {
      archiveLead(leadId).catch((error: unknown) => {
        console.error(error);
      });
    });
  }, []);

  const columns = React.useMemo<ColumnDef<LeadListItem>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Lead',
        cell: ({ row }) => {
          const lead = row.original;

          return (
            <div className="min-w-56">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{lead.name}</span>
                <PriorityBadge priority={lead.priority} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{lead.email}</p>
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
        id: 'project_type',
        header: 'Project type',
        cell: ({ row }) => (
          <span>{getLatestSubmission(row.original)?.project_type ?? 'Not captured'}</span>
        ),
      },
      {
        id: 'budget',
        header: 'Budget',
        cell: ({ row }) => (
          <span>{getLatestSubmission(row.original)?.budget_range ?? 'Not captured'}</span>
        ),
      },
      {
        id: 'timeline',
        header: 'Timeline',
        cell: ({ row }) => (
          <span>{getLatestSubmission(row.original)?.timeline ?? 'Not captured'}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <LeadStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'qualification_score',
        header: 'Score',
        cell: ({ row }) => <LeadScoreBadge score={row.original.qualification_score} />,
      },
      {
        id: 'owner',
        header: 'Owner',
        cell: ({ row }) => <span>{row.original.owner?.name ?? 'No owner'}</span>,
      },
      {
        accessorKey: 'last_contacted_at',
        header: 'Last contacted',
        cell: ({ row }) => (
          <span>{formatRelativeTime(row.original.last_contacted_at)}</span>
        ),
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
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Status</DropdownMenuLabel>
                  {leadStatuses.map((status) => (
                    <DropdownMenuItem
                      key={status}
                      onSelect={() => handleStatusChange(lead.id, status)}
                    >
                      {statusLabels[status]}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={() => handleArchiveLead(lead.id)}
                  >
                    <Archive className="size-4" />
                    Archive lead
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [handleArchiveLead, handleStatusChange, isPending],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredRows,
    columns,
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 8,
      },
    },
  });

  return (
    <div className="space-y-4">
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
      <LeadFilters
        filters={filters}
        sort={sort}
        budgets={budgets}
        timelines={timelines}
        sources={sources}
        owners={owners}
        onFiltersChange={setFilters}
        onSortChange={setSort}
      />
      <div className="surface-premium overflow-hidden rounded-lg">
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
                  role="link"
                  tabIndex={0}
                  className="cursor-pointer"
                  onClick={() => router.push(`/dashboard/leads/${row.original.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      router.push(`/dashboard/leads/${row.original.id}`);
                    }
                  }}
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
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/45 p-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing{' '}
          <span className="font-mono text-foreground">
            {table.getRowModel().rows.length}
          </span>{' '}
          of <span className="font-mono text-foreground">{filteredRows.length}</span>{' '}
          leads
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <span className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount() || 1}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
