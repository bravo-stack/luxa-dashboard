'use client';

import { SlidersHorizontal, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { leadStatuses } from '@/lib/dashboard/types';
import { statusLabels } from '@/lib/dashboard/utils';

export type LeadSortKey = 'newest' | 'oldest';

export type LeadFilterState = {
  status: string;
  budget: string;
  timeline: string;
  source: string;
  date: string;
};

export const defaultLeadFilters: LeadFilterState = {
  status: 'all',
  budget: 'all',
  timeline: 'all',
  source: 'all',
  date: 'all',
};

type LeadFiltersProps = {
  filters: LeadFilterState;
  sort: LeadSortKey;
  budgets: string[];
  timelines: string[];
  sources: string[];
  onFiltersChange: (filters: LeadFilterState) => void;
  onSortChange: (sort: LeadSortKey) => void;
};

function updateFilter(
  filters: LeadFilterState,
  key: keyof LeadFilterState,
  value: string,
) {
  return {
    ...filters,
    [key]: value,
  };
}

export function LeadFilters({
  filters,
  sort,
  budgets,
  timelines,
  sources,
  onFiltersChange,
  onSortChange,
}: LeadFiltersProps) {
  const hasFilters =
    Object.values(filters).some((value) => value !== 'all') || sort !== 'newest';

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex h-10 items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 text-sm font-semibold text-muted-foreground">
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          Filters
        </div>
        <Select
          value={filters.status}
          onValueChange={(value) =>
            onFiltersChange(updateFilter(filters, 'status', value))
          }
        >
          <SelectTrigger className="w-37.5">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {leadStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {statusLabels[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.budget}
          onValueChange={(value) =>
            onFiltersChange(updateFilter(filters, 'budget', value))
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Budget" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All budgets</SelectItem>
            {budgets.map((budget) => (
              <SelectItem key={budget} value={budget}>
                {budget}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.timeline}
          onValueChange={(value) =>
            onFiltersChange(updateFilter(filters, 'timeline', value))
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Timeline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All timelines</SelectItem>
            {timelines.map((timeline) => (
              <SelectItem key={timeline} value={timeline}>
                {timeline}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.source}
          onValueChange={(value) =>
            onFiltersChange(updateFilter(filters, 'source', value))
          }
        >
          <SelectTrigger className="w-45">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {sources.map((source) => (
              <SelectItem key={source} value={source}>
                {source}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.date}
          onValueChange={(value) => onFiltersChange(updateFilter(filters, 'date', value))}
        >
          <SelectTrigger className="w-37.5">
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any date</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="older">Older than 7 days</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sort}
          onValueChange={(value) => onSortChange(value as LeadSortKey)}
        >
          <SelectTrigger className="w-47.5">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onFiltersChange(defaultLeadFilters);
              onSortChange('newest');
            }}
          >
            <X className="size-4" />
            Clear
          </Button>
        ) : null}
      </div>
    </div>
  );
}
