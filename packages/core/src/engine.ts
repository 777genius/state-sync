import { compareRevisions, isCanonicalRevision, ZERO_REVISION } from './revision';
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

export interface RevisionSyncOptions<T> {
  topic: Topic;
  subscriber: InvalidationSubscriber;
  provider: SnapshotProvider<T>;
  applier: SnapshotApplier<T>;
  shouldRefresh?: (event: InvalidationEvent) => boolean;
  logger?: Logger;
  onError?: (ctx: SyncErrorContext) => void;
}

export interface RevisionSyncHandle {
  start(): Promise<void>;
  stop(): void;
  refresh(): Promise<void>;
  getLocalRevision(): Revision;
}

export function createRevisionSync<T>(options: RevisionSyncOptions<T>): RevisionSyncHandle {
  const { topic, subscriber, provider, applier, shouldRefresh, logger, onError } = options;

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
    refresh().catch(() => {});
  }

  const handle: RevisionSyncHandle = {
    async start() {
      if (stopped) {
        throw new Error('[state-sync] start() called after stop()');
      }
      if (started) return;
      started = true;
      logger?.debug('[state-sync] starting', { topic });

      try {
        unsubscribe = await subscriber.subscribe(handleInvalidation);
        logger?.debug('[state-sync] subscribed', { topic });
      } catch (err) {
        started = false;
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
        started = false;
        throw err;
      }
    },

    stop() {
      if (stopped) return;
      stopped = true;
      logger?.debug('[state-sync] stopped', { topic });
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
