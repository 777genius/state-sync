import type { SnapshotEnvelope } from '@statesync/core';
import type { CrossTabSyncOptions } from './types';

/**
 * Discriminated union of messages exchanged between tabs via BroadcastChannel.
 *
 * Each variant carries a `type` discriminator, a `tabId` identifying the sender,
 * and (for `'snapshot'`) the actual state payload.
 *
 * @typeParam T - The shape of the application state.
 */
export type CrossTabMessage<T> =
  | {
      /** Indicates this message carries a full snapshot. */
      type: 'snapshot';
      /** The snapshot envelope being broadcast. */
      payload: SnapshotEnvelope<T>;
      /** Unique identifier of the sending tab. */
      tabId: string;
    }
  | {
      /** Indicates the sender is requesting the latest state from peers. */
      type: 'request-sync';
      /** Unique identifier of the sending tab. */
      tabId: string;
    }
  | {
      /** Indicates the sender has cleared its persisted storage. */
      type: 'clear';
      /** Unique identifier of the sending tab. */
      tabId: string;
    };

/**
 * Cross-tab synchronization manager using the BroadcastChannel API.
 *
 * Enables real-time state synchronization between browser tabs sharing the
 * same origin and channel name. Messages from the current tab are automatically
 * filtered out. In environments where BroadcastChannel is unavailable, all
 * methods become no-ops.
 *
 * Created via {@link createCrossTabSync}.
 *
 * @typeParam T - The shape of the application state.
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
   * Broadcast a snapshot to all other tabs listening on the same channel.
   *
   * No-op if the instance is disposed, the channel is closed, or
   * {@link CrossTabSyncOptions.broadcastSaves} is `false`.
   *
   * @param snapshot - The snapshot envelope to broadcast.
   */
  broadcast(snapshot: SnapshotEnvelope<T>): void;

  /**
   * Send a sync request to other tabs, asking them to broadcast their
   * latest state. Useful during tab startup to hydrate from a peer.
   */
  requestSync(): void;

  /**
   * Notify other tabs that this tab has cleared its persisted storage.
   */
  notifyClear(): void;

  /**
   * Check whether the BroadcastChannel API is available and the channel
   * was successfully created.
   *
   * @returns `true` if cross-tab communication is functional.
   */
  isSupported(): boolean;

  /**
   * Get the unique identifier assigned to this tab.
   *
   * The ID is generated at construction time and is used to filter out
   * messages originating from this tab.
   *
   * @returns A string identifier unique to this tab instance.
   */
  getTabId(): string;

  /**
   * Close the BroadcastChannel and release all resources.
   *
   * After disposal, all methods become no-ops. Safe to call multiple times.
   */
  dispose(): void;
}

/**
 * Configuration and event handlers for {@link createCrossTabSync}.
 *
 * Extends {@link CrossTabSyncOptions} with callback handlers for each
 * type of cross-tab message.
 *
 * @typeParam T - The shape of the application state.
 */
export interface CrossTabSyncHandlers<T> extends CrossTabSyncOptions {
  /**
   * Called when a snapshot is received from another tab.
   *
   * @param snapshot - The snapshot envelope broadcast by the other tab.
   * @param fromTabId - The unique identifier of the sending tab.
   */
  onSnapshot?: (snapshot: SnapshotEnvelope<T>, fromTabId: string) => void;

  /**
   * Called when another tab sends a sync request, asking this tab to
   * broadcast its latest state.
   *
   * @param fromTabId - The unique identifier of the requesting tab.
   */
  onSyncRequest?: (fromTabId: string) => void;

  /**
   * Called when another tab notifies that it has cleared its storage.
   *
   * @param fromTabId - The unique identifier of the tab that cleared storage.
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
 * Checks whether the BroadcastChannel API is available in the current environment.
 *
 * Returns `false` in Node.js, Web Workers without BroadcastChannel support,
 * and other restricted environments.
 *
 * @returns `true` if `BroadcastChannel` is defined globally.
 */
export function isBroadcastChannelSupported(): boolean {
  return typeof BroadcastChannel !== 'undefined';
}

/**
 * Creates a {@link CrossTabSync} manager for real-time state synchronization
 * between browser tabs.
 *
 * Uses the BroadcastChannel API to send and receive messages. If
 * BroadcastChannel is not supported (e.g., in Node.js or restricted iframes),
 * a no-op implementation is returned silently.
 *
 * Messages from the current tab are automatically ignored to prevent echo loops.
 *
 * @typeParam T - The shape of the application state.
 * @param options - Channel configuration and event handler callbacks.
 * @returns A cross-tab sync manager. Call {@link CrossTabSync.dispose} when done.
 *
 * @example
 * ```typescript
 * const crossTab = createCrossTabSync<MyState>({
 *   channelName: 'state-sync:settings',
 *   onSnapshot: (snapshot, tabId) => {
 *     console.log(`Received state from tab ${tabId}`);
 *     applier.apply(snapshot);
 *   },
 * });
 * ```
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
 * Wraps a storage backend's `save` method to automatically broadcast
 * snapshots to other tabs after each successful save.
 *
 * This is a lower-level utility for cases where you want cross-tab sync
 * without using the full {@link createPersistenceApplier}. The returned
 * object exposes both the wrapped `save` function and the underlying
 * {@link CrossTabSync} instance for manual control.
 *
 * @typeParam T - The shape of the application state.
 * @param storage - Any object with a `save` method (typically a {@link StorageBackend}).
 * @param options - Cross-tab sync configuration and event handlers.
 * @returns An object with a `save` method (broadcasts after writing) and
 *   a `crossTab` property for direct access to the sync manager.
 *
 * @example
 * ```typescript
 * const { save, crossTab } = withCrossTabSync(
 *   createLocalStorageBackend({ key: 'my-state' }),
 *   {
 *     channelName: 'my-app-state',
 *     onSnapshot: (snapshot) => applier.apply(snapshot),
 *   },
 * );
 *
 * await save(snapshot); // Saves to storage AND broadcasts to other tabs
 * crossTab.dispose();   // Cleanup when done
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
