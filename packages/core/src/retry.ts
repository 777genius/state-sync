/**
 * Retry utilities for state-sync snapshot providers.
 *
 * Provides retry-with-backoff wrappers for {@link SnapshotProvider} instances,
 * allowing transient failures (network errors, temporary unavailability) to be
 * retried automatically before surfacing the error to the sync engine.
 *
 * @module
 */

import type { Logger, SnapshotEnvelope, SnapshotProvider, SyncErrorContext, Topic } from './types';

/**
 * Configuration for retry behavior with exponential backoff.
 *
 * All fields are optional and fall back to sensible defaults when omitted.
 * The delay between retries grows exponentially: `initialDelayMs * backoffMultiplier ^ attempt`,
 * capped at `maxDelayMs`.
 *
 * @example
 * ```ts
 * const policy: RetryPolicy = {
 *   maxAttempts: 5,
 *   initialDelayMs: 1000,
 *   backoffMultiplier: 1.5,
 *   maxDelayMs: 30_000,
 * };
 * ```
 */
export interface RetryPolicy {
  /**
   * Maximum number of attempts including the initial try.
   *
   * For example, `maxAttempts: 3` means 1 initial try + 2 retries.
   *
   * @defaultValue `3`
   */
  maxAttempts?: number;

  /**
   * Delay in milliseconds before the first retry attempt.
   *
   * Subsequent retries are scaled by {@link RetryPolicy.backoffMultiplier | backoffMultiplier}.
   *
   * @defaultValue `500`
   */
  initialDelayMs?: number;

  /**
   * Multiplier applied to the delay for each successive retry attempt.
   *
   * The delay for attempt N is: `initialDelayMs * backoffMultiplier ^ N`.
   * Set to `1` for fixed-interval retries (no exponential growth).
   *
   * @defaultValue `2`
   */
  backoffMultiplier?: number;

  /**
   * Upper bound for the computed delay in milliseconds.
   *
   * Prevents the exponential backoff from growing unboundedly.
   *
   * @defaultValue `10_000`
   */
  maxDelayMs?: number;
}

/**
 * Default retry policy values used when individual fields are not specified.
 * @internal
 */
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
 * Wraps a {@link SnapshotProvider} with automatic retries using exponential backoff.
 *
 * On each failed attempt (except the last), the `onRetry` callback is invoked
 * before the delay. This can be used for logging, metrics, or to inspect the error.
 * After all attempts are exhausted, the last error is re-thrown.
 *
 * The returned provider has the same interface as the original, so it can be used
 * as a drop-in replacement anywhere a `SnapshotProvider` is expected.
 *
 * @typeParam T - The snapshot data type carried inside the {@link SnapshotEnvelope}.
 *
 * @param provider - The original snapshot provider to wrap with retry logic.
 * @param policy - Optional retry configuration. Uses {@link RetryPolicy} defaults when omitted.
 * @param onRetry - Optional callback invoked after each failed attempt (before the backoff delay).
 *                  Receives an object with:
 *                  - `attempt`: The retry attempt number (1-based; 1 = first retry after initial failure).
 *                  - `error`: The error thrown by the provider.
 *                  - `nextDelayMs`: The delay in ms before the next attempt.
 * @returns A new {@link SnapshotProvider} that retries on failure according to the given policy.
 *
 * @throws The last error from the provider if all attempts are exhausted.
 *
 * @example
 * ```ts
 * import { withRetry } from '@statesync/core';
 *
 * const resilientProvider = withRetry(
 *   originalProvider,
 *   { maxAttempts: 5, initialDelayMs: 1000 },
 *   ({ attempt, error, nextDelayMs }) => {
 *     console.warn(`Retry ${attempt}, next delay: ${nextDelayMs}ms`, error);
 *   },
 * );
 * ```
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

/**
 * Options for {@link withRetryReporting}, which combines retry logic
 * with structured logging and error reporting.
 */
export interface RetryReportingOptions {
  /**
   * The topic associated with this provider, used for log context and error reporting.
   */
  topic: Topic;

  /**
   * Retry policy configuration. When omitted, the default {@link RetryPolicy} values are used.
   */
  policy?: RetryPolicy;

  /**
   * Logger instance for emitting structured retry warnings.
   * When provided, a `warn`-level message is logged for each retry attempt.
   */
  logger?: Logger;

  /**
   * Optional error hook invoked on each retry attempt.
   *
   * The callback receives a {@link SyncErrorContext} with:
   * - `phase` set to `'getSnapshot'`
   * - `willRetry` set to `true`
   * - `attempt` indicating which retry this is (1-based)
   * - `nextDelayMs` indicating the backoff delay before the next attempt
   *
   * If this callback itself throws, the error is caught and logged
   * (it does not affect the retry flow).
   */
  onError?: (ctx: SyncErrorContext) => void;
}

/**
 * Wraps a {@link SnapshotProvider} with retries and reports each intermediate
 * retry attempt via the provided logger and/or `onError` callback.
 *
 * This is a convenience wrapper around {@link withRetry} that integrates with
 * the state-sync error reporting pipeline. On each retry attempt, it:
 * 1. Logs a `warn`-level message via the logger (if provided).
 * 2. Calls the `onError` hook (if provided) with a {@link SyncErrorContext}.
 *
 * The **final** failure (when all retries are exhausted) is still thrown and
 * will be caught by the sync engine, which emits its own `getSnapshot` error.
 * This wrapper provides visibility into the intermediate retry attempts only.
 *
 * @typeParam T - The snapshot data type carried inside the {@link SnapshotEnvelope}.
 *
 * @param provider - The original snapshot provider to wrap with retry and reporting logic.
 * @param options - Configuration for retry behavior, logging, and error hooks.
 * @returns A new {@link SnapshotProvider} with retry and reporting behavior.
 *
 * @throws The last error from the provider if all retry attempts are exhausted.
 *
 * @example
 * ```ts
 * import { withRetryReporting } from '@statesync/core';
 *
 * const provider = withRetryReporting(originalProvider, {
 *   topic: 'user-profile',
 *   policy: { maxAttempts: 5 },
 *   logger: consoleLogger,
 *   onError: (ctx) => metrics.increment('sync.retry', { topic: ctx.topic }),
 * });
 * ```
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
