import type { PageQualitySummary } from '@/lib/dashboard/types';

function formatDuration(seconds: number) {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return `${minutes}m ${remainder}s`;
}

export function PageQualityTable({ pages }: { pages: PageQualitySummary[] }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-col gap-2 border-b border-border px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.6875rem] font-semibold tracking-[0.12em] text-primary uppercase">
            Content quality
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-foreground">
            Page-level attention
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Volume, reach, bounce, and engaged time in one operating view.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Native Umami page metrics</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-180 text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[0.6875rem] tracking-[0.08em] text-muted-foreground uppercase">
              <th className="px-5 py-3 font-semibold">Page</th>
              <th className="px-4 py-3 text-right font-semibold">Views</th>
              <th className="px-4 py-3 text-right font-semibold">Visitors</th>
              <th className="px-4 py-3 text-right font-semibold">Visits</th>
              <th className="px-4 py-3 text-right font-semibold">Bounce</th>
              <th className="px-5 py-3 text-right font-semibold">Avg. time</th>
            </tr>
          </thead>
          <tbody>
            {pages.length ? (
              pages.map((page, index) => (
                <tr
                  key={page.key}
                  className="border-b border-border last:border-0 hover:bg-muted/35"
                >
                  <td className="max-w-80 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="w-5 shrink-0 text-xs text-muted-foreground tabular-nums">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="truncate font-semibold text-foreground">
                        {page.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-foreground tabular-nums">
                    {page.pageviews.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-right text-muted-foreground tabular-nums">
                    {page.visitors.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-right text-muted-foreground tabular-nums">
                    {page.visits.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-right text-muted-foreground tabular-nums">
                    {page.bounceRate.toFixed(1)}%
                  </td>
                  <td className="px-5 py-4 text-right text-muted-foreground tabular-nums">
                    {formatDuration(page.averageTimeSeconds)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center text-muted-foreground">
                  Page-quality data will appear after Umami records native visits.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
