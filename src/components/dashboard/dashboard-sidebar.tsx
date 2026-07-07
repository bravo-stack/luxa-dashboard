'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  BookOpenText,
  CalendarClock,
  ExternalLink,
  Home,
  LayoutDashboard,
  Menu,
  Settings2,
  Sparkles,
  UsersRound,
  Workflow,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const primaryNav = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Leads', href: '/dashboard/leads', icon: UsersRound },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings2 },
];

const secondaryNav = [
  { label: 'Funnel', href: '/audit', icon: Workflow },
  { label: 'Selected Work', href: '/selected-work', icon: Sparkles },
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
          className="group flex items-center gap-3"
        >
          <span className="flex size-11 items-center justify-center rounded-2xl border border-primary/25 bg-primary/12 text-primary shadow-[0_0_34px_rgba(76,201,240,0.12)]">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-lg font-semibold text-foreground">Luxa</span>
            <span className="text-xs text-muted-foreground">Lead command</span>
          </span>
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
                    'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground',
                    isActive &&
                      'border border-primary/20 bg-primary/12 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
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
                  className="flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
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
        <div className="surface-glass rounded-3xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-accent-warm/12 text-sm font-semibold text-accent-warm">
              LA
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Luxa Admin</p>
              <p className="text-xs text-muted-foreground">Ops workspace</p>
            </div>
          </div>
          <Link
            href="/dashboard/leads"
            onClick={onNavigate}
            className="mt-4 flex items-center justify-between rounded-2xl border border-border bg-white/3 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
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
      <Button
        variant="secondary"
        size="icon"
        className="fixed top-3 left-4 z-50 lg:hidden"
        aria-label="Open dashboard navigation"
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" />
      </Button>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-sidebar-border bg-sidebar/92 text-sidebar-foreground backdrop-blur-xl lg:block">
        <SidebarContent />
      </aside>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-background/78 backdrop-blur-sm"
            aria-label="Close dashboard navigation"
            onClick={() => setOpen(false)}
          />
          <aside className="relative h-full w-[min(86vw,20rem)] border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-2xl">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3"
              aria-label="Close dashboard navigation"
              onClick={() => setOpen(false)}
            >
              <X className="size-5" />
            </Button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
