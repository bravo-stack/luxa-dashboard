import Link from 'next/link';
import { Bell, CircleHelp, Search } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export function DashboardTopbar() {
  return (
    <div className="sticky top-0 z-30 border-b border-border/70 bg-background/82 backdrop-blur-xl lg:ml-0">
      <div className="mx-auto flex h-16 max-w-375 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="ml-12 flex min-w-0 items-center gap-3 lg:ml-0">
          <div className="hidden h-9 min-w-72 items-center gap-2 rounded-2xl border border-border bg-white/3 px-3 text-sm text-muted-foreground md:flex">
            <Search className="size-4" aria-hidden="true" />
            <span>Search leads, audits, sources</span>
          </div>
          <span className="rounded-full border border-accent-teal/25 bg-accent-teal/10 px-3 py-1 text-xs font-semibold text-accent-teal">
            Mock data live
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Dashboard help">
            <CircleHelp className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Dashboard notifications">
            <Bell className="size-4" />
          </Button>
          <Link
            href="/dashboard/leads"
            className="hidden rounded-xl border border-border bg-white/3 px-3 py-2 text-sm font-semibold text-foreground hover:bg-white/6 sm:block"
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
