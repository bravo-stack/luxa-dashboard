import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type LoadingCardProps = {
  className?: string;
  rows?: number;
};

export function LoadingCard({ className, rows = 4 }: LoadingCardProps) {
  return (
    <div className={cn('surface-elevated rounded-2xl p-5', className)}>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-4 h-8 w-20" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-3 w-full" />
        ))}
      </div>
    </div>
  );
}
