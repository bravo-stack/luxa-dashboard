'use client';

import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';

type LeadSearchProps = {
  value: string;
  onValueChange: (value: string) => void;
};

export function LeadSearch({ value, onValueChange }: LeadSearchProps) {
  return (
    <label className="relative block min-w-0 flex-1">
      <span className="sr-only">Search leads</span>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder="Search name, email, company, website, project type"
        className="h-11 rounded-2xl pl-9"
      />
    </label>
  );
}
