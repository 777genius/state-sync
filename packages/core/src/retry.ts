import type { Logger, SnapshotEnvelope, SnapshotProvider, SyncErrorContext, Topic } from './types';

export interface RetryPolicy {
  /** Max attempts (including the first try). Default: 3 */
  maxAttempts?: number;
  /** Initial delay in ms. Default: 500 */
  initialDelayMs?: number;
  /** Exponential backoff multiplier. Default: 2 */
  backoffMultiplier?: number;
  /** Max delay in ms. Default: 10000 */
  maxDelayMs?: number;
}

const DEFAULT_POLICY: Required<RetryPolicy> = {
  maxAttempts: 3,
  initialDelayMs: 500,
  backoffMultiplier: 2,
  maxDelayMs: 10_000,
};

function resolvePolicy(policy?: RetryPolicy): Required<RetryPolicy> {
  return { ...DEFAULT_POLICY, ...policy };
}

function computeDelay(attempt: number, policy: Required<RetryPolicy>): number {
  const raw = policy.initialDelayMs * policy.backoffMultiplier ** attempt;
  return Math.min(raw, policy.maxDelayMs);
}

/**
 * Wraps a SnapshotProvider with retries using exponential backoff.
 *
 * On each failed attempt, `onRetry` is called (if provided) — you can use it for
 * logging or cancellation.
 */
export function withRetry<T>(
  provider: SnapshotProvider<T>,
  policy?: RetryPolicy,
  onRetry?: (info: { attempt: number; error: unknown; nextDelayMs: number }) => void,
): SnapshotProvider<T> {
  const resolved = resolvePolicy(policy);

  return {
    async getSnapshot(): Promise<SnapshotEnvelope<T>> {
      let lastError: unknown;

      for (let attempt = 0; attempt < resolved.maxAttempts; attempt++) {
        try {
          return await provider.getSnapshot();
        } catch (err) {
          lastError = err;

          if (attempt + 1 >= resolved.maxAttempts) break;

          const delay = computeDelay(attempt, resolved);
          onRetry?.({ attempt: attempt + 1, error: err, nextDelayMs: delay });
          await new Promise((r) => setTimeout(r, delay));
        }
      }

      throw lastError;
    },
  };
}

export interface RetryReportingOptions {
  topic: Topic;
  policy?: RetryPolicy;
  logger?: Logger;
  /**
   * Optional error hook. This reports retry attempts with:
   * - phase = 'getSnapshot'
   * - willRetry = true
   */
  onError?: (ctx: SyncErrorContext) => void;
}

/**
 * Convenience wrapper: retries a provider and reports retry attempts via logger/onError.
 *
 * Note: the final failure is still thrown by the provider; the engine will emit its own
 * `getSnapshot` error on that final failure. This wrapper is mainly for visibility into
 * intermediate retry attempts.
 */
export function withRetryReporting<T>(
  provider: SnapshotProvider<T>,
  options: RetryReportingOptions,
): SnapshotProvider<T> {
  const { topic, policy, logger, onError } = options;

  return withRetry(provider, policy, ({ attempt, error, nextDelayMs }) => {
    logger?.warn('[state-sync] getSnapshot retry scheduled', {
      topic,
      phase: 'getSnapshot',
      attempt,
      willRetry: true,
      nextDelayMs,
      error,
    });

    if (!onError) return;
    try {
      onError({
        phase: 'getSnapshot',
        topic,
        error,
        attempt,
        willRetry: true,
        nextDelayMs,
      });
    } catch (onErrorErr) {
      logger?.error('[state-sync] onError callback threw', { topic, error: onErrorErr });
    }
  });
}
