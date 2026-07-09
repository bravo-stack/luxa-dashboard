'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CalendarDays } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { dashboardDateRanges } from '@/lib/dashboard/mock-data';
import type { DateRangeKey } from '@/lib/dashboard/types';

type DateRangePickerProps = {
  defaultValue?: DateRangeKey;
};

export function DateRangePicker({ defaultValue = '7d' }: DateRangePickerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRange = (searchParams.get('range') as DateRangeKey | null) ?? defaultValue;

  function handleValueChange(nextValue: DateRangeKey) {
    const params = new URLSearchParams(window.location.search);

    params.set('range', nextValue);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-card p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="hidden size-8 items-center justify-center rounded-sm border border-border bg-muted/50 text-muted-foreground sm:flex">
        <CalendarDays className="size-4" aria-hidden="true" />
      </div>
      <Select
        value={currentRange}
        onValueChange={(nextValue) => handleValueChange(nextValue as DateRangeKey)}
      >
        <SelectTrigger
          className="h-9 w-[142px] border-0 bg-transparent shadow-none focus:ring-0"
          aria-label="Select dashboard date range"
        >
          <SelectValue placeholder="Date range" />
        </SelectTrigger>
        <SelectContent>
          {dashboardDateRanges.map((range) => (
            <SelectItem key={range.key} value={range.key}>
              {range.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
