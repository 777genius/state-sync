/**
 * Main-process APIs for Electron state-sync.
 *
 * These functions run exclusively in the Electron **main process** and handle:
 * - Broadcasting invalidation events to renderer windows via `webContents.send()`
 * - Serving snapshot requests from renderers via `ipcMain.handle()`
 *
 * @packageDocumentation
 */

import type { InvalidationEvent, SnapshotEnvelope } from '@statesync/core';
import {
  invalidationChannel as defaultInvalidationChannel,
  snapshotChannel as defaultSnapshotChannel,
} from './channels';
import type {
  ElectronIpcMainHandle,
  ElectronIpcMainRemoveHandler,
  ElectronWebContentsLike,
} from './types';

// ─── Broadcaster ────────────────────────────────────

/**
 * Configuration options for {@link createElectronBroadcaster}.
 */
export interface ElectronBroadcasterOptions {
  /** The sync topic identifier (e.g. `"user-profile"`). */
  topic: string;
  /**
   * Returns the list of `webContents` targets to broadcast invalidation events to.
   *
   * Called on every {@link ElectronBroadcasterHandle.invalidate} invocation.
   * The returned array is defensively copied (`.slice()`) before iteration,
   * so it is safe to return a live mutable reference (e.g. from a `Set` or window manager).
   *
   * @returns An array of {@link ElectronWebContentsLike} instances.
   */
  getTargets: () => ElectronWebContentsLike[];
  /**
   * Override the default IPC channel name for invalidation events.
   *
   * Defaults to `statesync:<topic>:invalidated` (produced by {@link invalidationChannel}).
   */
  channel?: string;
}

/**
 * Handle returned by {@link createElectronBroadcaster} for sending
 * invalidation events to renderer processes.
 *
 * **Process context:** main process only.
 */
export interface ElectronBroadcasterHandle {
  /** The sync topic this broadcaster is bound to. */
  readonly topic: string;

  /**
   * Broadcasts an invalidation event to all target renderer windows.
   *
   * Each target is guarded with `isDestroyed()` and a `try/catch` to handle
   * the TOCTOU race inherent in Electron multi-window apps (a `webContents`
   * can be destroyed between the check and the `send()` call).
   *
   * @param revision - The new revision string to broadcast.
   * @param extra - Optional additional fields for the {@link InvalidationEvent}.
   * @param extra.sourceId - Identifier of the source that produced this revision change.
   */
  invalidate(revision: string, extra?: { sourceId?: string }): void;
}

/**
 * Creates a broadcaster that pushes {@link InvalidationEvent} payloads to
 * renderer windows over Electron IPC.
 *
 * Call {@link ElectronBroadcasterHandle.invalidate} whenever the authoritative
 * state changes (e.g. after a database write) to notify all connected renderers
 * that their cached data is stale.
 *
 * **Process context:** main process only.
 *
 * **Safety:** Iterates targets with `try/catch` + `isDestroyed()` guard.
 * The TOCTOU race (webContents destroyed between check and `send()`) is a real
 * scenario in Electron multi-window apps — the `try/catch` handles it gracefully.
 * Non-TOCTOU errors are logged to `console.warn` so they are not silently lost.
 *
 * @param options - Configuration for the broadcaster.
 * @returns A handle with an {@link ElectronBroadcasterHandle.invalidate} method.
 *
 * @example
 * ```ts
 * import { BrowserWindow } from 'electron';
 * import { createElectronBroadcaster } from '@statesync/electron';
 *
 * const broadcaster = createElectronBroadcaster({
 *   topic: 'todos',
 *   getTargets: () => BrowserWindow.getAllWindows().map(w => w.webContents),
 * });
 *
 * // After a database write:
 * broadcaster.invalidate('42', { sourceId: 'api-handler' });
 * ```
 */
export function createElectronBroadcaster(
  options: ElectronBroadcasterOptions,
): ElectronBroadcasterHandle {
  const { topic, getTargets } = options;
  const channel = options.channel ?? defaultInvalidationChannel(topic);

  return {
    topic,
    invalidate(revision, extra) {
      const event: InvalidationEvent = {
        topic,
        revision: revision as InvalidationEvent['revision'],
        sourceId: extra?.sourceId,
        timestampMs: Date.now(),
      };

      const targets = getTargets().slice();
      for (const wc of targets) {
        try {
          if (!wc.isDestroyed()) {
            wc.send(channel, event);
          }
        } catch (err) {
          // TOCTOU: webContents can be destroyed between isDestroyed() and send().
          // Log unexpected non-TOCTOU errors so they are not silently lost.
          if (err instanceof Error && !err.message.includes('destroyed')) {
            console.warn('[state-sync] Unexpected broadcaster error:', err);
          }
        }
      }
    },
  };
}

// ─── Snapshot Handler ───────────────────────────────

/**
 * Configuration options for {@link createElectronSnapshotHandler}.
 *
 * @typeParam T - The application-specific snapshot data type.
 */
export interface ElectronSnapshotHandlerOptions<T> {
  /** The sync topic identifier (e.g. `"user-profile"`). */
  topic: string;

  /**
   * Returns the current snapshot envelope for the given topic.
   *
   * This callback may be invoked concurrently from multiple renderer windows
   * (each renderer calls `ipcRenderer.invoke()` independently). Implementations
   * must be safe for concurrent invocations and should avoid side effects.
   *
   * @returns The current snapshot, synchronously or as a promise.
   */
  getSnapshot: () => SnapshotEnvelope<T> | Promise<SnapshotEnvelope<T>>;

  /**
   * The `ipcMain.handle` function (or a compatible mock).
   *
   * Used to register the snapshot request handler on the IPC channel.
   *
   * @see {@link ElectronIpcMainHandle}
   */
  handle: ElectronIpcMainHandle;

  /**
   * The `ipcMain.removeHandler` function (or a compatible mock).
   *
   * Used by {@link ElectronSnapshotHandlerHandle.dispose} to unregister the handler.
   *
   * @see {@link ElectronIpcMainRemoveHandler}
   */
  removeHandler: ElectronIpcMainRemoveHandler;

  /**
   * Override the default IPC channel name for snapshot requests.
   *
   * Defaults to `statesync:<topic>:snapshot` (produced by {@link snapshotChannel}).
   */
  channel?: string;
}

/**
 * Handle returned by {@link createElectronSnapshotHandler} for managing the
 * lifecycle of a snapshot IPC handler.
 *
 * **Process context:** main process only.
 */
export interface ElectronSnapshotHandlerHandle {
  /** The sync topic this handler is bound to. */
  readonly topic: string;

  /**
   * Removes the `ipcMain.handle()` registration for this topic's snapshot channel.
   *
   * Call this on app quit or during HMR reload to prevent stale handler errors.
   * Safe to call multiple times — subsequent calls are no-ops.
   */
  dispose(): void;
}

/**
 * Registers an `ipcMain.handle()` listener that serves {@link SnapshotEnvelope}
 * responses to renderer processes requesting the current snapshot.
 *
 * When a renderer calls `ipcRenderer.invoke(channel)`, the registered
 * {@link ElectronSnapshotHandlerOptions.getSnapshot} callback is invoked,
 * and its result is returned as the IPC response.
 *
 * **Process context:** main process only.
 *
 * Errors thrown by `getSnapshot` are logged to `console.error` and re-thrown
 * so they propagate as IPC rejection to the renderer.
 *
 * @typeParam T - The application-specific snapshot data type.
 * @param options - Configuration for the snapshot handler.
 * @returns A disposable handle. Call {@link ElectronSnapshotHandlerHandle.dispose}
 *   to unregister the IPC handler.
 *
 * @example
 * ```ts
 * import { ipcMain } from 'electron';
 * import { createElectronSnapshotHandler } from '@statesync/electron';
 *
 * const handler = createElectronSnapshotHandler({
 *   topic: 'todos',
 *   getSnapshot: async () => ({
 *     revision: '42' as Revision,
 *     data: await db.getAllTodos(),
 *   }),
 *   handle: ipcMain.handle.bind(ipcMain),
 *   removeHandler: ipcMain.removeHandler.bind(ipcMain),
 * });
 *
 * // On app quit:
 * handler.dispose();
 * ```
 */
export function createElectronSnapshotHandler<T>(
  options: ElectronSnapshotHandlerOptions<T>,
): ElectronSnapshotHandlerHandle {
  const { topic, getSnapshot, handle, removeHandler } = options;
  const channel = options.channel ?? defaultSnapshotChannel(topic);

  handle(channel, async () => {
    try {
      return await getSnapshot();
    } catch (err) {
      console.error(`[state-sync] getSnapshot failed for topic "${topic}":`, err);
      throw err;
    }
  });

  let disposed = false;
  return {
    topic,
    dispose() {
      if (disposed) return;
      disposed = true;
      removeHandler(channel);
    },
  };
}
