import { LoadingCard } from '@/components/dashboard/loading-card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-8">
      <LoadingCard className="min-h-48" rows={2} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <LoadingCard key={index} rows={3} />
        ))}
      </div>
      <div className="surface-premium rounded-lg p-5">
        <div className="flex flex-col gap-3 xl:flex-row">
          <Skeleton className="h-11 flex-1" />
          <Skeleton className="h-11 w-36" />
        </div>
        <div className="mt-5 space-y-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
