import type {
  InvalidationEvent,
  InvalidationSubscriber,
  SnapshotEnvelope,
  SnapshotProvider,
} from '@statesync/core';

import type { ElectronInvoke, ElectronListen } from './types';

export interface ElectronInvalidationSubscriberOptions {
  /** bridge.on or any ElectronListen-compatible function */
  listen: ElectronListen;
  /** IPC channel for invalidation events */
  channel: string;
}

/**
 * Creates an InvalidationSubscriber using Electron IPC.
 *
 * Mirrors createTauriInvalidationSubscriber.
 * Transport is thin — just forwards payloads. Engine validates topic/revision.
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

export interface ElectronSnapshotProviderOptions {
  /** bridge.invoke or any ElectronInvoke-compatible function */
  invoke: ElectronInvoke;
  /** IPC channel for snapshot requests */
  channel: string;
}

/**
 * Creates a SnapshotProvider that fetches snapshots via Electron IPC invoke.
 *
 * Mirrors createTauriSnapshotProvider.
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
