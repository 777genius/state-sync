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

export interface ElectronBroadcasterOptions {
  topic: string;
  /**
   * Returns webContents to broadcast to. Called on every invalidation.
   * The returned array is copied before iteration, so it's safe to return a live reference.
   */
  getTargets: () => ElectronWebContentsLike[];
  /** Override default channel */
  channel?: string;
}

export interface ElectronBroadcasterHandle {
  readonly topic: string;
  invalidate(revision: string, extra?: { sourceId?: string }): void;
}

/**
 * Creates a broadcaster for invalidation events.
 *
 * Safety: iterates targets with try/catch + isDestroyed() guard.
 * Destroyed webContents between check and send() is a real
 * TOCTOU race in Electron multi-window apps — the try/catch handles it.
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

export interface ElectronSnapshotHandlerOptions<T> {
  topic: string;
  /**
   * Returns the current snapshot. May be called concurrently from multiple renderers.
   * Must be safe for concurrent invocations — avoid side effects.
   */
  getSnapshot: () => SnapshotEnvelope<T> | Promise<SnapshotEnvelope<T>>;
  handle: ElectronIpcMainHandle;
  removeHandler: ElectronIpcMainRemoveHandler;
  /** Override default channel */
  channel?: string;
}

export interface ElectronSnapshotHandlerHandle {
  readonly topic: string;
  /** Remove ipcMain.handle — call on app quit or HMR reload */
  dispose(): void;
}

/**
 * Registers ipcMain.handle() for snapshot requests.
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
