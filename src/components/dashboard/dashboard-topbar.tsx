import Link from 'next/link';
import { Bell, CircleHelp, Search } from 'lucide-react';

import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export function DashboardTopbar() {
  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background lg:ml-0">
      <div className="mx-auto flex h-16 max-w-375 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="ml-12 flex min-w-0 items-center gap-3 lg:ml-0">
          <div className="hidden h-9 min-w-72 items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 text-sm text-muted-foreground md:flex">
            <Search className="size-4" aria-hidden="true" />
            <span>Search leads, audits, sources</span>
          </div>
          <span className="rounded-md border border-border bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
            Snapshot ready
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" aria-label="Dashboard help">
            <CircleHelp className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Dashboard notifications">
            <Bell className="size-4" />
          </Button>
          <Link
            href="/dashboard/leads"
            className="hidden rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted sm:block"
          >
            Review queue
          </Link>
          <Avatar className="size-9 border border-primary/20">
            <AvatarFallback>LA</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}
