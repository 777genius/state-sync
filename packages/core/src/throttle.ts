/**
 * Invalidation throttling utilities for state-sync.
 *
 * Provides debounce and throttle mechanisms to control the rate of
 * refresh calls triggered by rapid invalidation events. This prevents
 * excessive network requests when many invalidation events arrive in
 * quick succession.
 *
 * @module
 */

/**
 * Configuration options for controlling invalidation-driven refresh rate.
 *
 * Supports three modes of operation:
 * - **Debounce only** (`debounceMs`): Waits for a quiet period before refreshing.
 * - **Throttle only** (`throttleMs`): Limits refresh to at most once per interval.
 * - **Combined** (both set): Debounce is applied first, then throttle limits the output rate.
 *
 * When neither option is set, refresh calls are passed through immediately.
 *
 * @example
 * ```ts
 * // Debounce: wait 200ms of silence before refreshing
 * const opts: InvalidationThrottlingOptions = { debounceMs: 200 };
 *
 * // Throttle: at most 1 refresh per second
 * const opts: InvalidationThrottlingOptions = { throttleMs: 1000 };
 *
 * // Combined: debounce 100ms, then throttle to 1/sec
 * const opts: InvalidationThrottlingOptions = {
 *   debounceMs: 100,
 *   throttleMs: 1000,
 * };
 * ```
 */
export interface InvalidationThrottlingOptions {
  /**
   * Debounce delay in milliseconds.
   *
   * Waits until this many milliseconds of "silence" (no new triggers) before
   * firing a refresh. If both `debounceMs` and `throttleMs` are set, debounce
   * is applied first within the throttle window.
   */
  debounceMs?: number;

  /**
   * Throttle interval in milliseconds.
   *
   * Ensures at most one refresh per this many milliseconds. Controls the
   * maximum rate of refresh calls regardless of how many triggers arrive.
   */
  throttleMs?: number;

  /**
   * Whether to fire immediately on the leading edge of the throttle window.
   *
   * When `true`, the first trigger in a new throttle window fires immediately.
   * Only applies when `throttleMs` is set.
   *
   * @defaultValue `true`
   */
  leading?: boolean;

  /**
   * Whether to fire on the trailing edge after the throttle window ends.
   *
   * When `true`, a final refresh is scheduled after the quiet period if any
   * triggers arrived during the throttle window. Only applies when `throttleMs`
   * is set.
   *
   * @defaultValue `true`
   */
  trailing?: boolean;
}

/**
 * Handle returned by {@link createThrottledHandler} that provides controlled
 * access to a throttled/debounced refresh callback.
 *
 * Callers use {@link ThrottledHandler.trigger | trigger()} to signal that a refresh is
 * desired. The handler decides when to actually invoke the underlying callback
 * based on its throttling configuration.
 */
export interface ThrottledHandler {
  /**
   * Signal that a refresh is desired.
   *
   * The actual refresh callback may be invoked immediately or delayed depending
   * on the throttling/debounce configuration. Multiple rapid calls to `trigger()`
   * may result in fewer actual refresh invocations.
   */
  trigger(): void;

  /**
   * Cancel all pending timers and reset internal state.
   *
   * Must be called when the sync handle is stopped to prevent stale
   * callbacks from firing after disposal. After calling `dispose()`,
   * the handler should not be used again.
   */
  dispose(): void;

  /**
   * Check whether there is a pending refresh scheduled but not yet executed.
   *
   * @returns `true` if a refresh is queued via debounce or trailing-edge timer,
   *          `false` otherwise.
   */
  hasPending(): boolean;
}

/**
 * Creates a {@link ThrottledHandler} that controls the rate of refresh calls.
 *
 * The handler adapts its behavior based on the provided options:
 * - **No options (or all zero):** Passthrough — `trigger()` calls `onRefresh` immediately.
 * - **`debounceMs` only:** Classic debounce — waits for a quiet period before calling `onRefresh`.
 * - **`throttleMs` only:** Classic throttle with configurable leading/trailing edges.
 * - **Both `debounceMs` and `throttleMs`:** Debounce is applied first, then the result is throttled.
 *
 * @param onRefresh - The callback to invoke when a refresh should occur. This is the actual
 *                    refresh function that fetches a new snapshot.
 * @param options - Optional throttling/debounce configuration. When omitted or empty,
 *                  the handler acts as a passthrough.
 * @returns A {@link ThrottledHandler} that wraps `onRefresh` with the configured rate limiting.
 *
 * @example
 * ```ts
 * import { createThrottledHandler } from '@statesync/core';
 *
 * const handler = createThrottledHandler(
 *   () => console.log('refresh!'),
 *   { debounceMs: 200, throttleMs: 1000 },
 * );
 *
 * handler.trigger(); // May fire immediately or be delayed
 * handler.hasPending(); // true if a delayed refresh is scheduled
 * handler.dispose(); // Cleanup when done
 * ```
 */
export function createThrottledHandler(
  onRefresh: () => void,
  options?: InvalidationThrottlingOptions,
): ThrottledHandler {
  if (!options || (!options.debounceMs && !options.throttleMs)) {
    return createPassthroughHandler(onRefresh);
  }

  const { debounceMs, throttleMs, leading = true, trailing = true } = options;

  if (throttleMs && throttleMs > 0) {
    if (!leading && !trailing) {
      console.warn(
        '[state-sync] throttling with leading=false and trailing=false will never trigger refresh',
      );
    }
    return createThrottleHandler(onRefresh, throttleMs, leading, trailing, debounceMs);
  }

  if (debounceMs && debounceMs > 0) {
    return createDebounceHandler(onRefresh, debounceMs);
  }

  return createPassthroughHandler(onRefresh);
}

function createPassthroughHandler(onRefresh: () => void): ThrottledHandler {
  return {
    trigger: onRefresh,
    dispose: () => {},
    hasPending: () => false,
  };
}

function createDebounceHandler(onRefresh: () => void, debounceMs: number): ThrottledHandler {
  let timerId: ReturnType<typeof setTimeout> | null = null;

  const trigger = (): void => {
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      timerId = null;
      onRefresh();
    }, debounceMs);
  };

  const dispose = (): void => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const hasPending = (): boolean => timerId !== null;

  return { trigger, dispose, hasPending };
}

function createThrottleHandler(
  onRefresh: () => void,
  throttleMs: number,
  leading: boolean,
  trailing: boolean,
  debounceMs?: number,
): ThrottledHandler {
  let lastCallTime = 0;
  let trailingTimerId: ReturnType<typeof setTimeout> | null = null;
  let debounceTimerId: ReturnType<typeof setTimeout> | null = null;
  let pendingTrailing = false;

  const executeRefresh = (): void => {
    lastCallTime = Date.now();
    pendingTrailing = false;
    onRefresh();
  };

  const scheduleTrailing = (delay: number): void => {
    if (trailingTimerId !== null) {
      clearTimeout(trailingTimerId);
    }
    pendingTrailing = true;
    trailingTimerId = setTimeout(() => {
      trailingTimerId = null;
      if (pendingTrailing) {
        executeRefresh();
      }
    }, delay);
  };

  const trigger = (): void => {
    if (debounceMs && debounceMs > 0) {
      if (debounceTimerId !== null) {
        clearTimeout(debounceTimerId);
      }
      debounceTimerId = setTimeout(() => {
        debounceTimerId = null;
        handleThrottledTrigger();
      }, debounceMs);
    } else {
      handleThrottledTrigger();
    }

    function handleThrottledTrigger(): void {
      const nowInner = Date.now();
      const elapsedInner = nowInner - lastCallTime;
      const remainingInner = throttleMs - elapsedInner;

      if (remainingInner <= 0) {
        if (leading) {
          executeRefresh();
        } else if (trailing) {
          scheduleTrailing(throttleMs);
        }
      } else {
        if (trailing && trailingTimerId === null) {
          scheduleTrailing(remainingInner);
        }
        pendingTrailing = trailing;
      }
    }
  };

  const dispose = (): void => {
    if (trailingTimerId !== null) {
      clearTimeout(trailingTimerId);
      trailingTimerId = null;
    }
    if (debounceTimerId !== null) {
      clearTimeout(debounceTimerId);
      debounceTimerId = null;
    }
    pendingTrailing = false;
  };

  const hasPending = (): boolean => {
    return trailingTimerId !== null || debounceTimerId !== null || pendingTrailing;
  };

  return { trigger, dispose, hasPending };
}
