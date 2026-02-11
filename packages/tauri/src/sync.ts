/**
 * High-level convenience factory for Tauri revision sync.
 *
 * Combines {@link createTauriInvalidationSubscriber} and
 * {@link createTauriSnapshotProvider} with the core `createRevisionSync`
 * engine in a single call, reducing boilerplate for the common case.
 *
 * @packageDocumentation
 */

import type { InvalidationThrottlingOptions, SnapshotApplier } from '@statesync/core';
import {
  createRevisionSync,
  type RevisionSyncHandle,
  type RevisionSyncOptions,
} from '@statesync/core';

import {
  createTauriInvalidationSubscriber,
  createTauriSnapshotProvider,
  type TauriInvoke,
  type TauriListen,
} from './transport';

/**
 * Configuration for {@link createTauriRevisionSync}.
 *
 * Merges Tauri-specific transport options (event name, command name, IPC
 * functions) with the core engine options (applier, logger, error handler,
 * throttling) into a single flat object for ergonomic one-call setup.
 *
 * @typeParam T - The application-specific snapshot data type.
 *
 * @example
 * ```typescript
 * const options: CreateTauriRevisionSyncOptions<MyState> = {
 *   topic: 'my-state',
 *   listen,
 *   invoke,
 *   eventName: 'state-sync:invalidation',
 *   commandName: 'get_my_state',
 *   applier: { apply: (snap) => store.setState(snap.data) },
 * };
 * ```
 */
export interface CreateTauriRevisionSyncOptions<T> {
  /**
   * A stable identifier for the synchronized domain or resource.
   *
   * Must be a non-empty string. This value is matched against the `topic`
   * field in incoming {@link InvalidationEvent}s so that only relevant
   * events trigger a refresh.
   */
  topic: string;

  /**
   * A Tauri-compatible `listen` function for subscribing to backend events.
   *
   * Typically `listen` from `@tauri-apps/api/event`.
   *
   * @see {@link TauriListen}
   */
  listen: TauriListen;

  /**
   * A Tauri-compatible `invoke` function for calling Rust commands.
   *
   * Typically `invoke` from `@tauri-apps/api/core`.
   *
   * @see {@link TauriInvoke}
   */
  invoke: TauriInvoke;

  /**
   * The Tauri event name to listen on for invalidation notifications.
   *
   * Must match the event name emitted by the Rust backend
   * (e.g., `app.emit("state-sync:invalidation", payload)`).
   */
  eventName: string;

  /**
   * The Tauri command name invoked to fetch the current snapshot.
   *
   * The Rust command must return a JSON object matching
   * `{ revision: string, data: T }` (a {@link SnapshotEnvelope}).
   */
  commandName: string;

  /**
   * Optional additional arguments forwarded to the snapshot command on every invoke.
   *
   * Useful for scoping the snapshot to a specific user, workspace, or resource.
   */
  args?: Record<string, unknown>;

  /**
   * The applier responsible for integrating a fetched snapshot into your
   * application state (e.g., updating a store, patching the UI).
   *
   * @see {@link SnapshotApplier}
   */
  applier: SnapshotApplier<T>;

  /**
   * Optional predicate evaluated before each refresh. If it returns `false`,
   * the invalidation is silently ignored.
   *
   * Forwarded directly to the core engine's `shouldRefresh` option.
   */
  shouldRefresh?: RevisionSyncOptions<T>['shouldRefresh'];

  /**
   * Optional structured logger for debug, warn, and error messages
   * produced by the sync engine.
   *
   * Forwarded directly to the core engine's `logger` option.
   */
  logger?: RevisionSyncOptions<T>['logger'];

  /**
   * Optional error callback invoked whenever the sync engine encounters
   * a problem (failed snapshot fetch, apply error, protocol violation, etc.).
   *
   * Forwarded directly to the core engine's `onError` option.
   */
  onError?: RevisionSyncOptions<T>['onError'];

  /**
   * Optional throttling / debouncing configuration to control how often
   * rapid invalidation events trigger a snapshot refresh.
   *
   * @see {@link InvalidationThrottlingOptions}
   */
  throttling?: InvalidationThrottlingOptions;
}

/**
 * One-call convenience factory that wires Tauri transport and the core
 * revision-sync engine together into a single {@link RevisionSyncHandle}.
 *
 * Under the hood it creates a {@link createTauriInvalidationSubscriber | TauriInvalidationSubscriber}
 * and a {@link createTauriSnapshotProvider | TauriSnapshotProvider}, then passes them
 * along with the remaining options to `createRevisionSync` from `@statesync/core`.
 *
 * This function is pure DX sugar; it does not introduce any new protocol
 * semantics beyond what the core engine already provides.
 *
 * @typeParam T - The application-specific snapshot data type.
 * @param options - Combined Tauri transport and core engine options.
 * @returns A {@link RevisionSyncHandle} that can be started, stopped, and manually refreshed.
 *
 * @example
 * ```typescript
 * import { invoke } from '@tauri-apps/api/core';
 * import { listen } from '@tauri-apps/api/event';
 * import { createTauriRevisionSync } from '@statesync/tauri';
 *
 * interface AppSettings {
 *   theme: 'light' | 'dark';
 *   locale: string;
 * }
 *
 * const sync = createTauriRevisionSync<AppSettings>({
 *   topic: 'settings',
 *   listen,
 *   invoke,
 *   eventName: 'settings-changed',
 *   commandName: 'get_settings',
 *   applier: {
 *     apply(snapshot) {
 *       settingsStore.set(snapshot.data);
 *     },
 *   },
 *   throttling: { debounceMs: 200 },
 *   logger: console,
 *   onError: (ctx) => console.error('Sync error', ctx),
 * });
 *
 * // Start listening and fetch the initial snapshot:
 * await sync.start();
 *
 * // Later, tear down:
 * sync.stop();
 * ```
 */
export function createTauriRevisionSync<T>(
  options: CreateTauriRevisionSyncOptions<T>,
): RevisionSyncHandle {
  const {
    topic,
    listen,
    invoke,
    eventName,
    commandName,
    args,
    applier,
    shouldRefresh,
    logger,
    onError,
    throttling,
  } = options;

  return createRevisionSync<T>({
    topic,
    subscriber: createTauriInvalidationSubscriber({ listen, eventName }),
    provider: createTauriSnapshotProvider<T>({ invoke, commandName, args }),
    applier,
    shouldRefresh,
    logger,
    onError,
    throttling,
  });
}
