import type { SnapshotEnvelope } from '@statesync/core';
import type { CrossTabSyncOptions } from './types';

/**
 * Message types for cross-tab communication.
 */
export type CrossTabMessage<T> =
  | { type: 'snapshot'; payload: SnapshotEnvelope<T>; tabId: string }
  | { type: 'request-sync'; tabId: string }
  | { type: 'clear'; tabId: string };

/**
 * Cross-tab synchronization manager using BroadcastChannel API.
 *
 * Enables real-time state synchronization between browser tabs.
 *
 * @example
 * ```typescript
 * const crossTab = createCrossTabSync<AppState>({
 *   channelName: 'my-app-state',
 *   onSnapshot: (snapshot) => applier.apply(snapshot),
 * });
 *
 * // Broadcast to other tabs after save
 * crossTab.broadcast(snapshot);
 *
 * // Cleanup
 * crossTab.dispose();
 * ```
 */
export interface CrossTabSync<T> {
  /**
   * Broadcast a snapshot to other tabs.
   */
  broadcast(snapshot: SnapshotEnvelope<T>): void;

  /**
   * Request sync from other tabs (useful on startup).
   */
  requestSync(): void;

  /**
   * Notify other tabs that storage was cleared.
   */
  notifyClear(): void;

  /**
   * Check if BroadcastChannel is supported.
   */
  isSupported(): boolean;

  /**
   * Get this tab's unique ID.
   */
  getTabId(): string;

  /**
   * Dispose and close the channel.
   */
  dispose(): void;
}

/**
 * Options for creating cross-tab sync.
 */
export interface CrossTabSyncHandlers<T> extends CrossTabSyncOptions {
  /**
   * Called when a snapshot is received from another tab.
   */
  onSnapshot?: (snapshot: SnapshotEnvelope<T>, fromTabId: string) => void;

  /**
   * Called when another tab requests sync.
   */
  onSyncRequest?: (fromTabId: string) => void;

  /**
   * Called when another tab clears storage.
   */
  onClear?: (fromTabId: string) => void;
}

/**
 * Generate a unique tab ID.
 */
function generateTabId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Check if BroadcastChannel is available.
 */
export function isBroadcastChannelSupported(): boolean {
  return typeof BroadcastChannel !== 'undefined';
}

/**
 * Creates a cross-tab synchronization manager.
 *
 * Uses BroadcastChannel API for real-time updates between tabs.
 * Falls back to no-op if BroadcastChannel is not supported.
 */
export function createCrossTabSync<T>(options: CrossTabSyncHandlers<T>): CrossTabSync<T> {
  const {
    channelName,
    receiveUpdates = true,
    broadcastSaves = true,
    onSnapshot,
    onSyncRequest,
    onClear,
  } = options;

  const tabId = generateTabId();
  let channel: BroadcastChannel | null = null;
  let disposed = false;

  // Check if supported
  if (!isBroadcastChannelSupported()) {
    return createNoopCrossTabSync(tabId);
  }

  try {
    channel = new BroadcastChannel(channelName);

    if (receiveUpdates) {
      channel.onmessage = (event: MessageEvent<CrossTabMessage<T>>) => {
        if (disposed) return;

        const message = event.data;

        // Ignore our own messages
        if (message.tabId === tabId) return;

        switch (message.type) {
          case 'snapshot':
            onSnapshot?.(message.payload, message.tabId);
            break;
          case 'request-sync':
            onSyncRequest?.(message.tabId);
            break;
          case 'clear':
            onClear?.(message.tabId);
            break;
        }
      };
    }
  } catch {
    // BroadcastChannel creation failed (e.g., in some restrictive environments)
    return createNoopCrossTabSync(tabId);
  }

  return {
    broadcast(snapshot: SnapshotEnvelope<T>): void {
      if (disposed || !channel || !broadcastSaves) return;
      try {
        const message: CrossTabMessage<T> = {
          type: 'snapshot',
          payload: snapshot,
          tabId,
        };
        channel.postMessage(message);
      } catch {
        // Ignore broadcast errors (channel might be closed)
      }
    },

    requestSync(): void {
      if (disposed || !channel) return;
      try {
        const message: CrossTabMessage<T> = {
          type: 'request-sync',
          tabId,
        };
        channel.postMessage(message);
      } catch {
        // Ignore
      }
    },

    notifyClear(): void {
      if (disposed || !channel) return;
      try {
        const message: CrossTabMessage<T> = {
          type: 'clear',
          tabId,
        };
        channel.postMessage(message);
      } catch {
        // Ignore
      }
    },

    isSupported(): boolean {
      return true;
    },

    getTabId(): string {
      return tabId;
    },

    dispose(): void {
      if (disposed) return;
      disposed = true;
      channel?.close();
      channel = null;
    },
  };
}

/**
 * Creates a no-op cross-tab sync for unsupported environments.
 */
function createNoopCrossTabSync<T>(tabId: string): CrossTabSync<T> {
  return {
    broadcast: () => {},
    requestSync: () => {},
    notifyClear: () => {},
    isSupported: () => false,
    getTabId: () => tabId,
    dispose: () => {},
  };
}

/**
 * Wrapper to add cross-tab sync to a storage backend.
 *
 * @example
 * ```typescript
 * const storage = withCrossTabSync(
 *   createLocalStorageBackend({ key: 'my-state' }),
 *   {
 *     channelName: 'my-app-state',
 *     onSnapshot: (snapshot) => applier.apply(snapshot),
 *   },
 * );
 * ```
 */
export function withCrossTabSync<T>(
  storage: { save(snapshot: SnapshotEnvelope<T>): Promise<void> },
  options: CrossTabSyncHandlers<T>,
): {
  save(snapshot: SnapshotEnvelope<T>): Promise<void>;
  crossTab: CrossTabSync<T>;
} {
  const crossTab = createCrossTabSync<T>(options);

  return {
    async save(snapshot: SnapshotEnvelope<T>): Promise<void> {
      await storage.save(snapshot);
      crossTab.broadcast(snapshot);
    },
    crossTab,
  };
}
