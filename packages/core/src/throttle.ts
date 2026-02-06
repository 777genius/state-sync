/**
 * Invalidation throttling utilities for state-sync.
 *
 * Provides debounce and throttle mechanisms to control the rate of
 * refresh calls triggered by rapid invalidation events.
 */

export interface InvalidationThrottlingOptions {
  /**
   * Debounce delay in milliseconds.
   * Waits until N ms of "silence" before triggering refresh.
   * If both debounceMs and throttleMs are set, debounce is applied first.
   */
  debounceMs?: number;

  /**
   * Throttle interval in milliseconds.
   * Ensures at most 1 refresh per N ms.
   */
  throttleMs?: number;

  /**
   * Fire immediately on the first event (default: true).
   * Only applies when throttleMs is set.
   */
  leading?: boolean;

  /**
   * Fire after the quiet period ends (default: true).
   * Only applies when throttleMs is set.
   */
  trailing?: boolean;
}

export interface ThrottledHandler {
  /**
   * Trigger a refresh. The actual refresh call may be delayed
   * based on the throttling configuration.
   */
  trigger(): void;

  /**
   * Cleanup all pending timers and reset state.
   * Should be called when the sync handle is stopped.
   */
  dispose(): void;

  /**
   * Returns true if there's a pending refresh scheduled.
   */
  hasPending(): boolean;
}

/**
 * Creates a throttled handler that controls refresh rate.
 *
 * Behavior:
 * - No options: passthrough (immediate call)
 * - debounceMs only: classic debounce
 * - throttleMs only: classic throttle with leading/trailing edges
 * - Both: debounce within throttle window
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
