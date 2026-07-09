import { LoadingCard } from '@/components/dashboard/loading-card';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="border-b border-border pb-8">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="mt-5 h-10 w-80 max-w-full" />
        <Skeleton className="mt-4 h-5 w-full max-w-xl" />
      </div>

      <section className="space-y-4" aria-label="Loading executive readout">
        <Skeleton className="h-6 w-44" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <LoadingCard key={index} rows={3} />
          ))}
        </div>
      </section>

      <section className="space-y-4" aria-label="Loading analytics charts">
        <Skeleton className="h-6 w-52" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
          <LoadingCard className="min-h-96" rows={8} />
          <LoadingCard className="min-h-96" rows={8} />
        </div>
      </section>

      <section className="space-y-4" aria-label="Loading acquisition quality">
        <Skeleton className="h-6 w-48" />
        <LoadingCard className="min-h-80" rows={10} />
      </section>
    </div>
  );
}
