'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Search, Settings2 } from 'lucide-react';

import { logout } from '@/app/actions';
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
import type { DashboardIdentity } from '@/lib/auth/types';

const titles = [
  { href: '/dashboard/team', label: 'Team' },
  { href: '/dashboard/analytics', label: 'Analytics' },
  { href: '/dashboard/leads', label: 'Leads' },
  { href: '/dashboard/settings', label: 'Settings' },
  { href: '/dashboard', label: 'Overview' },
];

function getPageTitle(pathname: string) {
  return titles.find((item) => pathname.startsWith(item.href))?.label ?? 'Dashboard';
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function DashboardTopbar({ identity }: { identity: DashboardIdentity }) {
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
            <form action="/dashboard/leads" className="relative w-full">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                name="q"
                type="search"
                maxLength={200}
                className="h-9 bg-muted/35 pl-9"
                placeholder="Search leads, audits, sources"
                aria-label="Search dashboard"
              />
            </form>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
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
                  <AvatarFallback>
                    {getInitials(identity.displayName) || 'LX'}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="max-w-56">
                <span className="block truncate text-foreground">
                  {identity.displayName}
                </span>
                <span className="mt-0.5 block truncate font-normal">
                  {identity.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <Settings2 className="size-4" />
                  {identity.role === 'admin' ? 'Workspace settings' : 'Account security'}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form action={logout} className="w-full">
                  <button type="submit" className="flex w-full items-center gap-2">
                    <LogOut className="size-4" />
                    Sign out
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
