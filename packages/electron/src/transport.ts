/**
 * Renderer-process transport layer for Electron state-sync.
 *
 * Provides {@link InvalidationSubscriber} and {@link SnapshotProvider}
 * implementations that communicate with the main process over Electron IPC.
 * These are the Electron equivalents of the Tauri transport primitives.
 *
 * **Process context:** renderer process (consumed via the bridge exposed by preload).
 *
 * @packageDocumentation
 */

import type {
  InvalidationEvent,
  InvalidationSubscriber,
  SnapshotEnvelope,
  SnapshotProvider,
} from '@statesync/core';

import type { ElectronInvoke, ElectronListen } from './types';

/**
 * Configuration options for {@link createElectronInvalidationSubscriber}.
 */
export interface ElectronInvalidationSubscriberOptions {
  /**
   * The listen function from the bridge (`bridge.on`) or any
   * {@link ElectronListen}-compatible function.
   */
  listen: ElectronListen;

  /**
   * The IPC channel name to subscribe to for invalidation events.
   *
   * Typically produced by {@link invalidationChannel} (e.g. `"statesync:todos:invalidated"`).
   */
  channel: string;
}

/**
 * Creates an {@link InvalidationSubscriber} that listens for invalidation events
 * over Electron IPC.
 *
 * This transport is intentionally thin — it simply forwards raw IPC payloads
 * as {@link InvalidationEvent} objects. The core engine is responsible for
 * validating `topic` and `revision` at runtime.
 *
 * Mirrors `createTauriInvalidationSubscriber` in the `@statesync/tauri` package.
 *
 * **Process context:** renderer process.
 *
 * @param options - Configuration specifying the listen function and IPC channel.
 * @returns An {@link InvalidationSubscriber} compatible with the core engine's
 *   {@link RevisionSyncOptions.subscriber} option.
 *
 * @example
 * ```ts
 * const subscriber = createElectronInvalidationSubscriber({
 *   listen: bridge.on,
 *   channel: 'statesync:todos:invalidated',
 * });
 * ```
 */
export function createElectronInvalidationSubscriber(
  options: ElectronInvalidationSubscriberOptions,
): InvalidationSubscriber {
  const { listen, channel } = options;
  return {
    async subscribe(handler) {
      return listen(channel, (...args: unknown[]) => {
        handler(args[0] as InvalidationEvent);
      });
    },
  };
}

/**
 * Configuration options for {@link createElectronSnapshotProvider}.
 */
export interface ElectronSnapshotProviderOptions {
  /**
   * The invoke function from the bridge (`bridge.invoke`) or any
   * {@link ElectronInvoke}-compatible function.
   */
  invoke: ElectronInvoke;

  /**
   * The IPC channel name for snapshot requests.
   *
   * Must match the channel registered by {@link createElectronSnapshotHandler}
   * in the main process. Typically produced by {@link snapshotChannel}
   * (e.g. `"statesync:todos:snapshot"`).
   */
  channel: string;
}

/**
 * Creates a {@link SnapshotProvider} that fetches snapshots from the main process
 * via Electron IPC `invoke`.
 *
 * When {@link SnapshotProvider.getSnapshot} is called, it sends an
 * `ipcRenderer.invoke()` request to the main process on the configured channel
 * and returns the resulting {@link SnapshotEnvelope}.
 *
 * Mirrors `createTauriSnapshotProvider` in the `@statesync/tauri` package.
 *
 * **Process context:** renderer process.
 *
 * @typeParam T - The application-specific snapshot data type.
 * @param options - Configuration specifying the invoke function and IPC channel.
 * @returns A {@link SnapshotProvider} compatible with the core engine's
 *   {@link RevisionSyncOptions.provider} option.
 *
 * @example
 * ```ts
 * const provider = createElectronSnapshotProvider<TodoList>({
 *   invoke: bridge.invoke,
 *   channel: 'statesync:todos:snapshot',
 * });
 *
 * const envelope = await provider.getSnapshot();
 * console.log(envelope.revision, envelope.data);
 * ```
 */
export function createElectronSnapshotProvider<T>(
  options: ElectronSnapshotProviderOptions,
): SnapshotProvider<T> {
  const { invoke, channel } = options;
  return {
    async getSnapshot(): Promise<SnapshotEnvelope<T>> {
      return (await invoke(channel)) as SnapshotEnvelope<T>;
    },
  };
}
