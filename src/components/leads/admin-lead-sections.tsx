'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  Eye,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
} from 'lucide-react';

import { LeadStatusBadge } from '@/components/leads/lead-status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { SalesLeadGroup } from '@/lib/dashboard/admin-lead-oversight';
import type { LeadListItem } from '@/lib/dashboard/types';
import {
  connectionStatusLabels,
  formatDate,
  formatRelativeTime,
} from '@/lib/dashboard/utils';

const pageSize = 8;

type DisplayLead = LeadListItem & {
  creatorName?: string;
};

function LeadCollection({
  leads,
  emptyTitle,
  emptyDescription,
  readOnly = false,
  searchPlaceholder,
}: {
  leads: DisplayLead[];
  emptyTitle: string;
  emptyDescription: string;
  readOnly?: boolean;
  searchPlaceholder: string;
}) {
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const deferredSearch = React.useDeferredValue(search.trim().toLowerCase());
  const filteredLeads = React.useMemo(() => {
    if (!deferredSearch) return leads;

    return leads.filter((lead) =>
      [lead.name, lead.email, lead.company, lead.creatorName]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(deferredSearch)),
    );
  }, [deferredSearch, leads]);
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleLeads = filteredLeads.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div>
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <label className="relative block max-w-xl">
          <span className="sr-only">Search this lead section</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            className="h-11 pl-10"
            placeholder={searchPlaceholder}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>
      </div>

      {visibleLeads.length ? (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/25 text-[0.625rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                <tr>
                  <th className="px-6 py-3.5">Lead</th>
                  {leads.some((lead) => lead.creatorName) ? (
                    <th className="px-5 py-3.5">Created by</th>
                  ) : null}
                  <th className="px-5 py-3.5">Stage</th>
                  <th className="px-5 py-3.5">Latest interaction</th>
                  <th className="px-5 py-3.5">Next follow-up</th>
                  <th className="px-6 py-3.5 text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibleLeads.map((lead) => (
                  <tr key={lead.id} className="transition-colors hover:bg-primary/4">
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/leads/${lead.id}`}
                        className="group inline-flex max-w-xs flex-col rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        <span className="truncate font-semibold text-foreground group-hover:text-primary">
                          {lead.name}
                        </span>
                        <span className="mt-1 truncate text-xs text-muted-foreground">
                          {lead.company} · {lead.email}
                        </span>
                      </Link>
                    </td>
                    {leads.some((item) => item.creatorName) ? (
                      <td className="px-5 py-4 text-xs font-medium text-foreground">
                        {lead.creatorName || 'Former teammate'}
                      </td>
                    ) : null}
                    <td className="px-5 py-4">
                      <LeadStatusBadge status={lead.status} />
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-foreground">
                        {lead.connectionStatus
                          ? connectionStatusLabels[lead.connectionStatus]
                          : 'No outreach captured'}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Updated {formatRelativeTime(lead.updated_at)}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="max-w-56 truncate font-medium text-foreground">
                        {lead.nextFollowUpAction || 'No next action'}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {lead.nextFollowUpDate
                          ? formatDate(lead.nextFollowUpDate)
                          : 'No date scheduled'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/leads/${lead.id}`}>
                          {readOnly ? 'Inspect' : 'Open'}
                          <ArrowRight aria-hidden="true" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-border lg:hidden">
            {visibleLeads.map((lead) => (
              <article key={lead.id} className="px-5 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/leads/${lead.id}`}
                      className="font-semibold text-foreground hover:text-primary"
                    >
                      {lead.name}
                    </Link>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {lead.company} · {lead.email}
                    </p>
                  </div>
                  <LeadStatusBadge status={lead.status} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 text-xs">
                  {lead.creatorName ? (
                    <div>
                      <p className="text-muted-foreground">Created by</p>
                      <p className="mt-1 font-semibold text-foreground">
                        {lead.creatorName}
                      </p>
                    </div>
                  ) : null}
                  <div>
                    <p className="text-muted-foreground">Interaction</p>
                    <p className="mt-1 font-semibold text-foreground">
                      {lead.connectionStatus
                        ? connectionStatusLabels[lead.connectionStatus]
                        : 'Not captured'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Next action</p>
                    <p className="mt-1 line-clamp-2 font-semibold text-foreground">
                      {lead.nextFollowUpAction || 'Not scheduled'}
                    </p>
                  </div>
                </div>
                <Button asChild variant="secondary" size="sm" className="mt-4 w-full">
                  <Link href={`/dashboard/leads/${lead.id}`}>
                    {readOnly ? 'Inspect lead' : 'Open lead'}
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="px-6 py-12 text-center">
          <BriefcaseBusiness
            className="mx-auto size-5 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-semibold text-foreground">
            {deferredSearch ? 'No leads match this search' : emptyTitle}
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-muted-foreground">
            {deferredSearch
              ? 'Try a lead name, company, email, or sales executive.'
              : emptyDescription}
          </p>
        </div>
      )}

      {filteredLeads.length > pageSize ? (
        <div className="flex flex-col gap-3 border-t border-border bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-muted-foreground tabular-nums">
            Showing {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, filteredLeads.length)} of{' '}
            {filteredLeads.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Previous
            </Button>
            <span className="px-2 text-xs text-muted-foreground tabular-nums">
              {currentPage} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AdminLeadSections({
  adminLeads,
  salesLeadGroups,
}: {
  adminLeads: LeadListItem[];
  salesLeadGroups: SalesLeadGroup[];
}) {
  const salesLeads = salesLeadGroups.flatMap((group) =>
    group.leads.map((lead) => ({ ...lead, creatorName: group.member.displayName })),
  );

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_18px_55px_rgba(18,24,40,0.045)]">
        <div className="grid gap-5 border-b border-border bg-surface-premium px-5 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="size-4" aria-hidden="true" />
              <p className="text-[0.6875rem] font-semibold tracking-[0.12em] uppercase">
                Admin lead desk
              </p>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold tracking-[-0.025em] text-foreground">
                Admin-managed leads
              </h2>
              <Badge variant="outline">{adminLeads.length} leads</Badge>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Add and manage direct entries, inbound opportunities, imports, and leads not
              authored by a sales executive.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/leads/new">
              Add an admin lead
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <LeadCollection
          leads={adminLeads}
          emptyTitle="No admin-managed leads yet"
          emptyDescription="Add a direct lead or wait for the next inbound opportunity."
          searchPlaceholder="Search admin leads by name, company, or email"
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_18px_55px_rgba(18,24,40,0.045)]">
        <div className="border-b border-border px-5 py-6 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <Eye className="size-4" aria-hidden="true" />
                <p className="text-[0.6875rem] font-semibold tracking-[0.12em] uppercase">
                  Sales oversight
                </p>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold tracking-[-0.025em] text-foreground">
                  Sales-executive leads
                </h2>
                <Badge variant="secondary">Read only</Badge>
                <Badge variant="outline">{salesLeads.length} leads</Badge>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Inspect what each executive created and the current follow-up state
                without changing their working records.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <UsersRound className="size-4" aria-hidden="true" />
              {salesLeadGroups.length} sales executive
              {salesLeadGroups.length === 1 ? '' : 's'}
            </div>
          </div>

          {salesLeadGroups.length ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {salesLeadGroups.map(({ member, leads }) => {
                const activeLeads = leads.filter(
                  (lead) => !['won', 'lost', 'spam'].includes(lead.status),
                ).length;
                const recentTouch = leads
                  .map((lead) => lead.updated_at)
                  .sort((first, second) => second.localeCompare(first))[0];

                return (
                  <Link
                    key={member.id}
                    href={`/dashboard/team/${member.id}`}
                    className="group rounded-lg border border-border bg-background p-4 transition-[border-color,background-color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary/3 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                          <UserRound className="size-4" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                            {member.displayName}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {member.email}
                          </p>
                        </div>
                      </div>
                      <ArrowRight
                        className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-xs">
                      <div>
                        <p className="text-muted-foreground">Created</p>
                        <p className="mt-1 font-semibold text-foreground tabular-nums">
                          {leads.length}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Active</p>
                        <p className="mt-1 font-semibold text-foreground tabular-nums">
                          {activeLeads}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last touch</p>
                        <p className="mt-1 truncate font-semibold text-foreground">
                          {recentTouch ? formatRelativeTime(recentTouch) : 'None'}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 flex items-center gap-3 rounded-lg border border-dashed border-border px-4 py-4 text-sm text-muted-foreground">
              <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
              Invite a sales executive to start the read-only oversight view.
            </div>
          )}
        </div>

        <LeadCollection
          leads={salesLeads}
          readOnly
          emptyTitle="No sales-created leads yet"
          emptyDescription="Leads created by sales executives will appear here automatically."
          searchPlaceholder="Search sales leads or an executive"
        />
      </section>
    </div>
  );
}
