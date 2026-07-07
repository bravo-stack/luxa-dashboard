import { AlertTriangle } from 'lucide-react';

import { cn } from '@/lib/utils';

type ErrorStateProps = {
  title?: string;
  description?: string;
  className?: string;
};

export function ErrorState({
  title = 'Dashboard data could not load',
  description = 'Refresh the view or check the data connection before making operational changes.',
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('surface-premium rounded-3xl p-8 text-center', className)}>
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl border border-destructive/25 bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
