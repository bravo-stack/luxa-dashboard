'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  BookOpenText,
  BriefcaseBusiness,
  CalendarClock,
  ExternalLink,
  Home,
  LayoutDashboard,
  Menu,
  Settings2,
  UsersRound,
  Workflow,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const primaryNav = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Leads', href: '/dashboard/leads', icon: UsersRound },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings2 },
];

const secondaryNav = [
  { label: 'Funnel', href: '/audit', icon: Workflow },
  { label: 'Selected Work', href: '/selected-work', icon: BriefcaseBusiness },
  { label: 'Book Call', href: '/book-call', icon: CalendarClock },
  { label: 'Public Site', href: '/', icon: Home },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="block rounded-md px-3 py-2 transition-colors hover:bg-sidebar-accent"
        >
          <span className="block text-lg font-semibold text-sidebar-foreground">
            Luxa
          </span>
          <span className="text-xs text-sidebar-foreground/64">Lead command</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-7 px-3 py-2" aria-label="Dashboard navigation">
        <div>
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase">
            Command
          </p>
          <div className="mt-2 space-y-1">
            {primaryNav.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-sidebar-foreground/72 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    isActive &&
                      'border border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground',
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div>
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase">
            Funnel paths
          </p>
          <div className="mt-2 space-y-1">
            {secondaryNav.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground/72 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="size-4" aria-hidden="true" />
                    {item.label}
                  </span>
                  <ExternalLink className="size-3.5 opacity-45" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
      <div className="p-4">
        <div className="rounded-lg border border-sidebar-border bg-sidebar-accent p-4">
          <p className="text-sm font-semibold text-sidebar-foreground">Luxa Admin</p>
          <p className="text-xs text-sidebar-foreground/64">Ops workspace</p>
          <Link
            href="/dashboard/leads"
            onClick={onNavigate}
            className="mt-4 flex items-center justify-between rounded-md border border-sidebar-border bg-sidebar px-3 py-2 text-xs font-semibold text-sidebar-foreground/75 hover:text-sidebar-foreground"
          >
            Needs attention
            <BookOpenText className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function DashboardSidebar() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-3 left-4 z-40 lg:hidden"
            aria-label="Open dashboard navigation"
          >
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent className="p-0">
          <SheetTitle className="sr-only">Dashboard navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Navigate Luxa dashboard sections.
          </SheetDescription>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:block">
        <SidebarContent />
      </aside>
    </>
  );
}
