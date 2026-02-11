import type { InvalidationThrottlingOptions, SnapshotApplier } from '@statesync/core';
import {
  createRevisionSync,
  type RevisionSyncHandle,
  type RevisionSyncOptions,
} from '@statesync/core';

import { invalidationChannel, snapshotChannel } from './channels';
import { createElectronInvalidationSubscriber, createElectronSnapshotProvider } from './transport';
import type { ElectronStateSyncBridge } from './types';

export interface CreateElectronRevisionSyncOptions<T> {
  topic: string;
  /** The bridge object from window.statesync */
  bridge: ElectronStateSyncBridge;
  applier: SnapshotApplier<T>;

  /** Override default channel: statesync:${topic}:invalidated */
  invalidationChannel?: string;
  /** Override default channel: statesync:${topic}:snapshot */
  snapshotChannel?: string;

  shouldRefresh?: RevisionSyncOptions<T>['shouldRefresh'];
  logger?: RevisionSyncOptions<T>['logger'];
  onError?: RevisionSyncOptions<T>['onError'];
  throttling?: InvalidationThrottlingOptions;
}

/**
 * Convenience factory wiring Electron bridge → transport → core engine.
 * Mirrors createTauriRevisionSync.
 *
 * Accepts bridge (high-level) instead of separate listen/invoke
 * because in Electron the bridge is always a single object on window.
 * Internally decomposes into listen + invoke for the transport layer.
 */
export function createElectronRevisionSync<T>(
  options: CreateElectronRevisionSyncOptions<T>,
): RevisionSyncHandle {
  const { topic, bridge, applier, shouldRefresh, logger, onError, throttling } = options;

  return createRevisionSync<T>({
    topic,
    subscriber: createElectronInvalidationSubscriber({
      listen: bridge.on,
      channel: options.invalidationChannel ?? invalidationChannel(topic),
    }),
    provider: createElectronSnapshotProvider<T>({
      invoke: bridge.invoke,
      channel: options.snapshotChannel ?? snapshotChannel(topic),
    }),
    applier,
    shouldRefresh,
    logger,
    onError,
    throttling,
  });
}
