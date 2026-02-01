import type { SnapshotApplier } from '@statesync/core';
import {
  createRevisionSync,
  type RevisionSyncHandle,
  type RevisionSyncOptions,
} from '@statesync/core';

import {
  createTauriInvalidationSubscriber,
  createTauriSnapshotProvider,
  type TauriInvoke,
  type TauriListen,
} from './transport';

export interface CreateTauriRevisionSyncOptions<T> {
  topic: string;

  listen: TauriListen;
  invoke: TauriInvoke;

  /**
   * Event name used for invalidation events.
   */
  eventName: string;

  /**
   * Tauri command name used to fetch a snapshot.
   */
  commandName: string;

  /**
   * Optional invoke args passed to the snapshot command.
   */
  args?: Record<string, unknown>;

  applier: SnapshotApplier<T>;

  /**
   * Optional pass-through options to core.
   */
  shouldRefresh?: RevisionSyncOptions<T>['shouldRefresh'];
  logger?: RevisionSyncOptions<T>['logger'];
  onError?: RevisionSyncOptions<T>['onError'];
}

/**
 * Convenience factory that wires Tauri transport + core engine into one handle.
 *
 * This is DX sugar only; it does not add new protocol semantics.
 */
export function createTauriRevisionSync<T>(
  options: CreateTauriRevisionSyncOptions<T>,
): RevisionSyncHandle {
  const {
    topic,
    listen,
    invoke,
    eventName,
    commandName,
    args,
    applier,
    shouldRefresh,
    logger,
    onError,
  } = options;

  return createRevisionSync<T>({
    topic,
    subscriber: createTauriInvalidationSubscriber({ listen, eventName }),
    provider: createTauriSnapshotProvider<T>({ invoke, commandName, args }),
    applier,
    shouldRefresh,
    logger,
    onError,
  });
}
