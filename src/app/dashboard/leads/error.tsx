'use client';

import { ErrorState } from '@/components/dashboard/error-state';
import { Button } from '@/components/ui/button';

export default function Error({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-2xl space-y-4">
        <ErrorState
          title="Lead queue paused"
          description="The lead list could not load. Retry before making changes to status or owner assignment."
        />
        <Button onClick={() => unstable_retry()}>Retry lead queue</Button>
      </div>
    </div>
  );
}
