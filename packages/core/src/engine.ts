import { compareRevisions, isCanonicalRevision, ZERO_REVISION } from './revision';
import {
  createThrottledHandler,
  type InvalidationThrottlingOptions,
  type ThrottledHandler,
} from './throttle';
import type {
  InvalidationEvent,
  InvalidationSubscriber,
  Logger,
  Revision,
  SnapshotApplier,
  SnapshotProvider,
  SyncErrorContext,
  SyncPhase,
  Topic,
  Unsubscribe,
} from './types';

/**
 * Configuration options for creating a revision-based sync loop.
 *
 * Provides all the dependencies and behavioral hooks the engine needs to
 * subscribe to invalidation events, fetch snapshots, apply them locally,
 * and handle errors. Pass this to {@link createRevisionSync} to obtain
 * a {@link RevisionSyncHandle}.
 *
 * @typeParam T - The application-specific snapshot data type.
 *
 * @example
 * ```ts
 * const options: RevisionSyncOptions<UserProfile> = {
 *   topic: 'user-profile',
 *   subscriber: myWebSocketSubscriber,
 *   provider: { getSnapshot: () => fetch('/api/snapshot').then(r => r.json()) },
 *   applier: { apply: ({ data }) => store.setState(data) },
 *   logger: createConsoleLogger({ debug: true }),
 *   onError: (ctx) => Sentry.captureException(ctx.error),
 *   throttling: { debounceMs: 200 },
 * };
 * ```
 */
export interface RevisionSyncOptions<T> {
  /**
   * The topic identifier that scopes this sync loop.
   * Must be a non-empty string; the engine validates this at creation time.
   */
  topic: Topic;
  /**
   * The invalidation subscriber that delivers real-time change notifications.
   * The engine subscribes to it on {@link RevisionSyncHandle.start} and
   * unsubscribes on {@link RevisionSyncHandle.stop}.
   */
  subscriber: InvalidationSubscriber;
  /**
   * The snapshot provider used to fetch the latest authoritative state.
   * Called during the initial load and after each invalidation event
   * that passes the revision and {@link shouldRefresh} checks.
   */
  provider: SnapshotProvider<T>;
  /**
   * The snapshot applier that writes fetched data into local state.
   * Called only when the fetched snapshot has a higher revision than
   * the current local revision.
   */
  applier: SnapshotApplier<T>;
  /**
   * Optional predicate that can suppress a refresh for a specific invalidation event.
   * Return `false` to skip the refresh; return `true` (or omit) to allow it.
   *
   * @param event - The normalized {@link InvalidationEvent} that triggered the refresh.
   * @returns Whether the engine should proceed with the refresh.
   */
  shouldRefresh?: (event: InvalidationEvent) => boolean;
  /**
   * Optional logger for tracing engine lifecycle events and errors.
   * If omitted, the engine operates silently.
   */
  logger?: Logger;
  /**
   * Optional error callback invoked whenever the engine encounters an error.
   * Receives a {@link SyncErrorContext} with structured details about the failure.
   *
   * @param ctx - The structured error context.
   */
  onError?: (ctx: SyncErrorContext) => void;
  /**
   * Optional throttling configuration to control refresh rate.
   *
   * Use `debounceMs` to wait for "silence" before refreshing.
   * Use `throttleMs` to limit refresh frequency.
   * Both can be combined: debounce is applied first, within the throttle window.
   */
  throttling?: InvalidationThrottlingOptions;
}

/**
 * A handle for controlling a running revision-based sync loop.
 *
 * Returned by {@link createRevisionSync}. The sync loop does not start
 * automatically -- call {@link start} to begin subscribing and fetching.
 * Call {@link stop} to tear down all subscriptions and timers.
 *
 * @example
 * ```ts
 * const handle = createRevisionSync(options);
 * await handle.start();
 *
 * // Later, force a manual refresh:
 * await handle.refresh();
 *
 * // Teardown:
 * handle.stop();
 * ```
 */
export interface RevisionSyncHandle {
  /**
   * Starts the sync loop: subscribes to invalidation events and performs
   * the initial snapshot fetch.
   *
   * Must be called exactly once. Calling `start()` after `stop()` throws.
   * Calling `start()` while already started is a no-op.
   *
   * @throws If subscription fails or the initial snapshot fetch fails.
   *         On failure the handle is reset and can be retried by calling `start()` again.
   */
  start(): Promise<void>;
  /**
   * Stops the sync loop: unsubscribes from invalidation events, cancels
   * pending throttled/debounced refreshes, and marks the handle as stopped.
   *
   * Safe to call multiple times; subsequent calls are no-ops.
   */
  stop(): void;
  /**
   * Manually triggers a snapshot fetch and apply cycle.
   *
   * Concurrent calls are coalesced: if a refresh is already in flight,
   * the new request is queued and executed once the current one completes.
   * If the handle is stopped, this is a no-op.
   *
   * @throws If the snapshot fetch or apply fails.
   */
  refresh(): Promise<void>;
  /**
   * Returns the most recently applied local revision.
   *
   * Before the first successful snapshot apply, this returns `ZERO_REVISION` (`"0"`).
   *
   * @returns The current local {@link Revision}.
   */
  getLocalRevision(): Revision;
}

/**
 * Creates a revision-based state synchronization loop.
 *
 * The returned {@link RevisionSyncHandle} is inert until {@link RevisionSyncHandle.start | start()}
 * is called. Once started, the engine:
 *
 * 1. Subscribes to invalidation events via the provided {@link InvalidationSubscriber}.
 * 2. Fetches the initial snapshot via the provided {@link SnapshotProvider}.
 * 3. Applies the snapshot via the provided {@link SnapshotApplier} if it is newer.
 * 4. On each subsequent invalidation event whose revision exceeds the local revision,
 *    triggers a new fetch-and-apply cycle (subject to optional throttling).
 *
 * Concurrent refreshes are coalesced: at most one fetch is in flight at a time,
 * and a trailing refresh is automatically queued if events arrive mid-flight.
 *
 * @typeParam T - The application-specific snapshot data type.
 *
 * @param options - Configuration for the sync loop. See {@link RevisionSyncOptions}.
 * @returns A {@link RevisionSyncHandle} to control the sync lifecycle.
 *
 * @throws {Error} If `options.topic` is not a non-empty string (fails synchronously).
 *
 * @example
 * ```ts
 * const handle = createRevisionSync<UserProfile>({
 *   topic: 'user-profile',
 *   subscriber: webSocketSubscriber,
 *   provider: httpSnapshotProvider,
 *   applier: { apply: ({ data }) => store.setState(data) },
 * });
 *
 * await handle.start();
 * // Sync is now running. Call handle.stop() to tear down.
 * ```
 */
export function createRevisionSync<T>(options: RevisionSyncOptions<T>): RevisionSyncHandle {
  const { topic, subscriber, provider, applier, shouldRefresh, logger, onError, throttling } =
    options;

  if (typeof topic !== 'string' || topic.trim() === '') {
    throw new Error('[state-sync] topic must be a non-empty string');
  }

  let localRevision: Revision = ZERO_REVISION;
  let hasAppliedSnapshot = false;
  let unsubscribe: Unsubscribe | null = null;
  let started = false;
  let stopped = false;
  let refreshInFlight = false;
  let refreshQueued = false;
  let throttledHandler: ThrottledHandler | null = null;

  function emitError(phase: SyncPhase, error: unknown, extra?: Partial<SyncErrorContext>) {
    const logExtra: SyncErrorContext = {
      phase,
      topic,
      error,
      ...extra,
    };
    logger?.error(`[state-sync] ${phase} error`, logExtra);
    try {
      onError?.(logExtra);
    } catch (onErrorErr) {
      logger?.error('[state-sync] onError callback threw', { topic, error: onErrorErr });
    }
  }

  async function refresh(): Promise<void> {
    if (stopped) {
      logger?.debug('[state-sync] refresh skipped (stopped)', { topic });
      return;
    }
    if (refreshInFlight) {
      logger?.debug('[state-sync] refresh coalesced (in-flight)', { topic });
      refreshQueued = true;
      return;
    }

    logger?.debug('[state-sync] refresh started', { topic });

    refreshInFlight = true;
    try {
      do {
        refreshQueued = false;
        let alreadyEmitted = false;
        try {
          let envelope: { revision: unknown; data: unknown };
          try {
            envelope = await provider.getSnapshot();
          } catch (err) {
            emitError('getSnapshot', err, { localRevision });
            alreadyEmitted = true;
            throw err;
          }

          const rawSnapshotRevision = (envelope as unknown as { revision?: unknown }).revision;
          if (!isCanonicalRevision(rawSnapshotRevision)) {
            const err = new Error(`Non-canonical snapshot revision: "${envelope.revision}"`);
            emitError('protocol', err, {
              localRevision,
              snapshotRevision:
                typeof (envelope as unknown as { revision?: unknown }).revision === 'string'
                  ? ((envelope as unknown as { revision?: string }).revision as Revision)
                  : undefined,
            });
            alreadyEmitted = true;
            throw err;
          }
          const snapshotRevision = rawSnapshotRevision;

          if (stopped) break;

          if (!hasAppliedSnapshot || compareRevisions(snapshotRevision, localRevision) > 0) {
            if (stopped) break;
            try {
              await applier.apply({ revision: snapshotRevision, data: envelope.data as T });
            } catch (err) {
              emitError('apply', err, {
                localRevision,
                snapshotRevision,
              });
              alreadyEmitted = true;
              throw err;
            }
            if (!stopped) {
              hasAppliedSnapshot = true;
              localRevision = snapshotRevision;
              logger?.debug('[state-sync] applied snapshot', { topic, revision: snapshotRevision });
            }
          } else {
            logger?.debug('[state-sync] snapshot skipped (not newer)', {
              topic,
              snapshotRevision,
              localRevision,
            });
          }
        } catch (err) {
          if (!alreadyEmitted) {
            emitError('refresh', err);
          }
          throw err;
        }
      } while (refreshQueued && !stopped);
    } finally {
      refreshInFlight = false;
    }
  }

  function handleInvalidation(event: InvalidationEvent): void {
    if (stopped) return;

    const rawTopic = (event as unknown as { topic?: unknown }).topic;
    if (typeof rawTopic !== 'string' || rawTopic.trim() === '') {
      emitError('protocol', new Error('Empty topic in invalidation event'), {
        sourceEvent: event,
        localRevision,
      });
      return;
    }

    const rawRevision = (event as unknown as { revision?: unknown }).revision;
    if (!isCanonicalRevision(rawRevision)) {
      emitError(
        'protocol',
        new Error(`Non-canonical revision in invalidation event: "${event.revision}"`),
        {
          sourceEvent: event,
          localRevision,
        },
      );
      return;
    }

    const normalizedEvent: InvalidationEvent = {
      topic: rawTopic,
      revision: rawRevision,
      sourceId:
        typeof (event as unknown as { sourceId?: unknown }).sourceId === 'string'
          ? (event as unknown as { sourceId?: string }).sourceId
          : undefined,
      timestampMs:
        typeof (event as unknown as { timestampMs?: unknown }).timestampMs === 'number'
          ? (event as unknown as { timestampMs?: number }).timestampMs
          : undefined,
    };

    if (normalizedEvent.topic !== topic) return;

    if (compareRevisions(normalizedEvent.revision, localRevision) <= 0) {
      logger?.debug('[state-sync] invalidation skipped (not newer)', {
        topic,
        eventRevision: normalizedEvent.revision,
        localRevision,
      });
      return;
    }

    if (shouldRefresh && !shouldRefresh(normalizedEvent)) {
      logger?.debug('[state-sync] invalidation skipped (shouldRefresh)', {
        topic,
        event: normalizedEvent,
      });
      return;
    }

    logger?.debug('[state-sync] invalidation triggered refresh', {
      topic,
      eventRevision: normalizedEvent.revision,
    });

    if (throttledHandler) {
      throttledHandler.trigger();
    } else {
      refresh().catch(() => {});
    }
  }

  const handle: RevisionSyncHandle = {
    async start() {
      if (stopped) {
        throw new Error('[state-sync] start() called after stop()');
      }
      if (started) return;
      started = true;
      logger?.debug('[state-sync] starting', { topic });

      throttledHandler = createThrottledHandler(() => {
        refresh().catch(() => {});
      }, throttling);

      try {
        unsubscribe = await subscriber.subscribe(handleInvalidation);
        logger?.debug('[state-sync] subscribed', { topic });
      } catch (err) {
        started = false;
        throttledHandler?.dispose();
        throttledHandler = null;
        emitError('subscribe', err);
        throw err;
      }

      try {
        await refresh();
        logger?.debug('[state-sync] started', { topic });
      } catch (err) {
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }
        throttledHandler?.dispose();
        throttledHandler = null;
        started = false;
        throw err;
      }
    },

    stop() {
      if (stopped) return;
      stopped = true;
      logger?.debug('[state-sync] stopped', { topic });
      if (throttledHandler) {
        throttledHandler.dispose();
        throttledHandler = null;
      }
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    },

    refresh,

    getLocalRevision() {
      return localRevision;
    },
  };

  return handle;
}
