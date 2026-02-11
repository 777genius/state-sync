/**
 * High-level convenience factory for Electron state-sync in the renderer process.
 *
 * {@link createElectronRevisionSync} wires the Electron bridge, transport layer,
 * and core revision-sync engine into a single {@link RevisionSyncHandle}.
 *
 * **Process context:** renderer process.
 *
 * @packageDocumentation
 */

import type { InvalidationThrottlingOptions, SnapshotApplier } from '@statesync/core';
import {
  createRevisionSync,
  type RevisionSyncHandle,
  type RevisionSyncOptions,
} from '@statesync/core';

import { invalidationChannel, snapshotChannel } from './channels';
import { createElectronInvalidationSubscriber, createElectronSnapshotProvider } from './transport';
import type { ElectronStateSyncBridge } from './types';

/**
 * Configuration options for {@link createElectronRevisionSync}.
 *
 * @typeParam T - The application-specific snapshot data type.
 */
export interface CreateElectronRevisionSyncOptions<T> {
  /** The sync topic identifier (e.g. `"user-profile"`). Must be a non-empty string. */
  topic: string;

  /**
   * The bridge object exposed via `contextBridge.exposeInMainWorld()` in the preload script.
   *
   * Typically accessed as `(window as any).statesync` in the renderer.
   * Created by {@link createElectronBridge}.
   */
  bridge: ElectronStateSyncBridge;

  /**
   * Callback invoked to apply a new snapshot to the application state.
   *
   * @see {@link SnapshotApplier} from `@statesync/core`.
   */
  applier: SnapshotApplier<T>;

  /**
   * Override the default IPC channel for invalidation events.
   *
   * Defaults to `statesync:<topic>:invalidated`.
   */
  invalidationChannel?: string;

  /**
   * Override the default IPC channel for snapshot requests.
   *
   * Defaults to `statesync:<topic>:snapshot`.
   */
  snapshotChannel?: string;

  /**
   * Optional predicate to filter invalidation events before triggering a refresh.
   *
   * If provided, only events for which this returns `true` will cause a snapshot fetch.
   *
   * @see {@link RevisionSyncOptions.shouldRefresh}
   */
  shouldRefresh?: RevisionSyncOptions<T>['shouldRefresh'];

  /**
   * Optional logger for debug, warn, and error messages.
   *
   * @see {@link RevisionSyncOptions.logger}
   */
  logger?: RevisionSyncOptions<T>['logger'];

  /**
   * Optional error callback invoked when any phase of the sync loop fails.
   *
   * @see {@link RevisionSyncOptions.onError}
   */
  onError?: RevisionSyncOptions<T>['onError'];

  /**
   * Optional throttling/debouncing configuration to control how frequently
   * invalidation events trigger snapshot refreshes.
   *
   * @see {@link InvalidationThrottlingOptions} from `@statesync/core`.
   */
  throttling?: InvalidationThrottlingOptions;
}

/**
 * Convenience factory that wires the Electron bridge, transport layer, and core
 * revision-sync engine into a single {@link RevisionSyncHandle}.
 *
 * This is pure DX sugar — it does not add new protocol semantics beyond what
 * the core engine provides. Internally it decomposes the bridge into separate
 * `listen` and `invoke` functions for the transport layer.
 *
 * Mirrors `createTauriRevisionSync` in the `@statesync/tauri` package.
 *
 * **Process context:** renderer process.
 *
 * @typeParam T - The application-specific snapshot data type.
 * @param options - Configuration including the bridge, topic, applier, and optional overrides.
 * @returns A {@link RevisionSyncHandle} with `start()`, `stop()`, `refresh()`,
 *   and `getLocalRevision()` methods.
 *
 * @example
 * ```ts
 * import type { ElectronStateSyncBridge } from '@statesync/electron';
 * import { createElectronRevisionSync } from '@statesync/electron';
 *
 * const bridge = (window as any).statesync as ElectronStateSyncBridge;
 *
 * const sync = createElectronRevisionSync<TodoList>({
 *   topic: 'todos',
 *   bridge,
 *   applier: {
 *     apply(snapshot) {
 *       todoStore.setState(snapshot.data);
 *     },
 *   },
 * });
 *
 * await sync.start();
 * // ... later
 * sync.stop();
 * ```
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
