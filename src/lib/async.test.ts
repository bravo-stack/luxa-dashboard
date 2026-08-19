import { describe, expect, it } from 'vitest';

import { createConcurrencyLimiter } from './async';

describe('createConcurrencyLimiter', () => {
  it('never runs more than the configured number of tasks', async () => {
    const limit = createConcurrencyLimiter(2);
    let activeCount = 0;
    let peakCount = 0;

    const results = await Promise.all(
      Array.from({ length: 6 }, (_, index) =>
        limit(async () => {
          activeCount += 1;
          peakCount = Math.max(peakCount, activeCount);
          await new Promise((resolve) => setTimeout(resolve, 5));
          activeCount -= 1;
          return index;
        }),
      ),
    );

    expect(peakCount).toBe(2);
    expect(results).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('continues draining the queue after a task fails', async () => {
    const limit = createConcurrencyLimiter(1);
    const failure = limit(async () => {
      throw new Error('failed');
    });
    const success = limit(async () => 'complete');

    await expect(failure).rejects.toThrow('failed');
    await expect(success).resolves.toBe('complete');
  });

  it.each([0, -1, 1.5])('rejects an invalid concurrency of %s', (value) => {
    expect(() => createConcurrencyLimiter(value)).toThrow(
      'maxConcurrency must be a positive integer.',
    );
  });
});
