/**
 * Tauri transport primitives for state-sync.
 *
 * Provides thin adapters that map Tauri's IPC mechanisms (event `listen` and
 * command `invoke`) onto the `@statesync/core` transport contracts
 * ({@link InvalidationSubscriber} and {@link SnapshotProvider}).
 *
 * Both factory functions accept structural types rather than concrete Tauri
 * imports, so they are fully testable without a running Tauri runtime.
 *
 * @packageDocumentation
 */

import type {
  InvalidationEvent,
  InvalidationSubscriber,
  SnapshotEnvelope,
  SnapshotProvider,
  Unsubscribe,
} from '@statesync/core';

/**
 * Minimal structural type matching the Tauri `listen` function signature.
 *
 * Accepts any function that:
 * 1. Takes an event name and a handler callback.
 * 2. Returns a promise that resolves to an {@link Unsubscribe} teardown function.
 *
 * Consumers can pass:
 * - `listen` from `@tauri-apps/api/event` (production)
 * - A custom stub with the same shape (testing / mocking)
 *
 * @typeParam T - The payload type carried by the Tauri event. Defaults to `unknown`.
 *
 * @example
 * ```typescript
 * import { listen } from '@tauri-apps/api/event';
 *
 * // `listen` satisfies TauriListen out of the box:
 * const tauriListen: TauriListen = listen;
 * ```
 */
export type TauriListen = <T = unknown>(
  eventName: string,
  handler: (event: { payload: T }) => void,
) => Promise<Unsubscribe>;

/**
 * Minimal structural type matching the Tauri `invoke` function signature.
 *
 * Accepts any function that:
 * 1. Takes a Tauri command name and an optional args record.
 * 2. Returns a promise resolving to the command's return value.
 *
 * Consumers can pass:
 * - `invoke` from `@tauri-apps/api/core` (production)
 * - A custom stub with the same shape (testing / mocking)
 *
 * @typeParam T - The return type of the invoked Tauri command.
 *
 * @example
 * ```typescript
 * import { invoke } from '@tauri-apps/api/core';
 *
 * // `invoke` satisfies TauriInvoke out of the box:
 * const tauriInvoke: TauriInvoke = invoke;
 * ```
 */
export type TauriInvoke = <T>(commandName: string, args?: Record<string, unknown>) => Promise<T>;

/**
 * Configuration for {@link createTauriInvalidationSubscriber}.
 */
export interface TauriInvalidationSubscriberOptions {
  /**
   * A Tauri-compatible `listen` function used to subscribe to backend events.
   *
   * The function is called once with `eventName` and an internal handler.
   * The Rust backend is expected to emit events on this channel whose payload
   * is an {@link InvalidationEvent}-shaped object (at minimum `{ topic, revision }`).
   */
  listen: TauriListen;

  /**
   * The Tauri event name to listen on.
   *
   * Must match the event name used by the Rust backend when calling
   * `app.emit("event-name", payload)` or `window.emit("event-name", payload)`.
   *
   * @example `'state-sync:invalidation'`
   */
  eventName: string;
}

/**
 * Creates an {@link InvalidationSubscriber} backed by Tauri's event system.
 *
 * The returned subscriber listens for events on the specified channel and
 * forwards each payload to the core engine as an {@link InvalidationEvent}.
 * No validation or transformation is performed here; the core engine validates
 * `topic` and `revision` at runtime.
 *
 * **Rust backend requirement:** The backend must emit events whose JSON payload
 * has at least `{ topic: string, revision: string }`. Additional fields
 * (`sourceId`, `timestampMs`) are optional but recommended.
 *
 * @param options - Configuration specifying the `listen` function and event name.
 * @returns An {@link InvalidationSubscriber} that can be passed to `createRevisionSync`.
 *
 * @example
 * ```typescript
 * import { listen } from '@tauri-apps/api/event';
 *
 * const subscriber = createTauriInvalidationSubscriber({
 *   listen,
 *   eventName: 'state-sync:invalidation',
 * });
 *
 * // Use with the core engine:
 * const sync = createRevisionSync({
 *   topic: 'my-topic',
 *   subscriber,
 *   provider,
 *   applier,
 * });
 * ```
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

/**
 * Configuration for {@link createTauriSnapshotProvider}.
 */
export interface TauriSnapshotProviderOptions {
  /**
   * A Tauri-compatible `invoke` function used to call Rust commands.
   *
   * @see {@link TauriInvoke}
   */
  invoke: TauriInvoke;

  /**
   * The name of the Tauri command that returns the current snapshot.
   *
   * The Rust command must return a JSON object matching
   * `{ revision: string, data: T }` (i.e., a {@link SnapshotEnvelope}).
   *
   * @example `'get_app_state'`
   */
  commandName: string;

  /**
   * Optional additional arguments forwarded to the Tauri command on every call.
   *
   * Useful for passing identifiers like a user ID or workspace key so the
   * backend knows which slice of state to return.
   *
   * @example
   * ```typescript
   * { workspaceId: 'ws_abc123' }
   * ```
   */
  args?: Record<string, unknown>;
}

/**
 * Creates a {@link SnapshotProvider} that fetches snapshots by invoking a Tauri command.
 *
 * Each call to `getSnapshot()` invokes the specified Rust command and expects
 * a {@link SnapshotEnvelope} in return. The command receives any extra `args`
 * provided in the options.
 *
 * **Rust backend requirement:** The command must return a JSON-serializable
 * struct with `{ revision: String, data: T }`.
 *
 * @typeParam T - The application-specific snapshot data type.
 * @param options - Configuration specifying the `invoke` function, command name, and optional args.
 * @returns A {@link SnapshotProvider} that can be passed to `createRevisionSync`.
 *
 * @example
 * ```typescript
 * import { invoke } from '@tauri-apps/api/core';
 *
 * interface AppState {
 *   counters: Record<string, number>;
 * }
 *
 * const provider = createTauriSnapshotProvider<AppState>({
 *   invoke,
 *   commandName: 'get_app_state',
 *   args: { workspaceId: 'ws_abc123' },
 * });
 *
 * const envelope = await provider.getSnapshot();
 * console.log(envelope.revision, envelope.data.counters);
 * ```
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
