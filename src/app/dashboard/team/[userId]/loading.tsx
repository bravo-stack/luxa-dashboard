import { LoadingCard } from '@/components/dashboard/loading-card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-32" />
      <div className="border-b border-border pb-7">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-4 h-10 w-80 max-w-full" />
        <Skeleton className="mt-3 h-4 w-xl max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <LoadingCard key={index} rows={2} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <LoadingCard className="min-h-96" rows={7} />
        <LoadingCard className="min-h-96" rows={7} />
      </div>
    </div>
  );
}
