import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type DashboardHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  description: string;
  actions?: ReactNode;
  className?: string;
};

export function DashboardHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: DashboardHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between',
        className,
      )}
    >
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="mb-3 text-xs font-semibold text-primary uppercase">{eyebrow}</p>
        ) : null}
        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-3">{actions}</div>
      ) : null}
    </header>
  );
}
