'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, CheckCircle2, LogOut, Search, Settings2, UserRound } from 'lucide-react';

import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

const titles = [
  { href: '/dashboard/analytics', label: 'Analytics' },
  { href: '/dashboard/leads', label: 'Leads' },
  { href: '/dashboard/settings', label: 'Settings' },
  { href: '/dashboard', label: 'Overview' },
];

function getPageTitle(pathname: string) {
  return titles.find((item) => pathname.startsWith(item.href))?.label ?? 'Dashboard';
}

export function DashboardTopbar() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/96 lg:ml-0">
      <div className="mx-auto flex min-h-16 max-w-375 items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="ml-12 flex min-w-0 items-center gap-4 lg:ml-0">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Luxa</p>
            <h1 className="truncate text-base font-semibold text-foreground">
              {getPageTitle(pathname)}
            </h1>
          </div>
          <div className="hidden min-w-80 items-center md:flex">
            <div className="relative w-full">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                className="h-9 bg-muted/35 pl-9"
                placeholder="Search leads, audits, sources"
                aria-label="Search dashboard"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Dashboard notifications">
                <Bell className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-4 text-success" />
                <span className="grid gap-0.5">
                  <span className="font-medium">Analytics snapshot ready</span>
                  <span className="text-xs text-muted-foreground">
                    Latest dashboard summaries are available.
                  </span>
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link href="/dashboard/leads">Review queue</Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                aria-label="Open user menu"
              >
                <Avatar className="size-9 border border-border">
                  <AvatarFallback>LA</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Luxa Admin</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserRound className="size-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings2 className="size-4" />
                Workspace settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
