import type {
  InvalidationEvent,
  InvalidationSubscriber,
  SnapshotEnvelope,
  SnapshotProvider,
  Unsubscribe,
} from 'state-sync';

/**
 * Minimal structural type for Tauri `listen`.
 *
 * Consumers can pass:
 * - `listen` from `@tauri-apps/api/event`
 * - or any compatible function (for testing/mocking).
 */
export type TauriListen = <T = unknown>(
  eventName: string,
  handler: (event: { payload: T }) => void,
) => Promise<Unsubscribe>;

/**
 * Minimal structural type for Tauri `invoke`.
 *
 * Consumers can pass:
 * - `invoke` from `@tauri-apps/api/core`
 * - or any compatible function (for testing/mocking).
 */
export type TauriInvoke = <T>(commandName: string, args?: Record<string, unknown>) => Promise<T>;

export interface TauriInvalidationSubscriberOptions {
  listen: TauriListen;
  eventName: string;
}

/**
 * Creates an InvalidationSubscriber using Tauri's event system.
 *
 * IMPORTANT:
 * - The engine validates `topic` and `revision` at runtime.
 * - This transport is intentionally thin: it just forwards payloads.
 */
export function createTauriInvalidationSubscriber(
  options: TauriInvalidationSubscriberOptions,
): InvalidationSubscriber {
  const { listen, eventName } = options;

  return {
    async subscribe(handler) {
      return await listen(eventName, (event) => {
        // Payload is expected to be an InvalidationEvent-like object.
        handler(event.payload as unknown as InvalidationEvent);
      });
    },
  };
}

export interface TauriSnapshotProviderOptions {
  invoke: TauriInvoke;
  commandName: string;
  args?: Record<string, unknown>;
}

/**
 * Creates a SnapshotProvider that fetches snapshots via Tauri `invoke`.
 */
export function createTauriSnapshotProvider<T>(
  options: TauriSnapshotProviderOptions,
): SnapshotProvider<T> {
  const { invoke, commandName, args } = options;

  return {
    async getSnapshot(): Promise<SnapshotEnvelope<T>> {
      return await invoke<SnapshotEnvelope<T>>(commandName, args);
    },
  };
}
