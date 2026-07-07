'use client';

import * as React from 'react';
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
  const [value, setValue] = React.useState<DateRangeKey>(defaultValue);

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border bg-white/3 p-1.5">
      <div className="hidden size-8 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex">
        <CalendarDays className="size-4" aria-hidden="true" />
      </div>
      <Select
        value={value}
        onValueChange={(nextValue) => setValue(nextValue as DateRangeKey)}
      >
        <SelectTrigger className="h-9 w-[142px] border-0 bg-transparent shadow-none focus:ring-0">
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
