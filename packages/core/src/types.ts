/**
 * state-sync (core)
 *
 * Protocol primitives and contracts for revision-based state synchronization.
 *
 * v0 principles:
 * - event = invalidation (tells clients "your data is stale")
 * - snapshot = source of truth (authoritative state fetched from the server)
 * - revision = canonical decimal u64 string (JSON/IPC friendly, totally ordered)
 *
 * @packageDocumentation
 */

/**
 * A stable identifier for a synchronized domain or resource.
 *
 * Topics are used to scope invalidation events and snapshots so that
 * multiple independent sync loops can coexist without interfering.
 *
 * v0 runtime rule (validated by the engine on input):
 * - MUST be a non-empty string after `trim()`
 *
 * @example
 * ```ts
 * const topic: Topic = 'user-profile';
 * ```
 */
export type Topic = string;

/**
 * Canonical decimal u64 string.
 *
 * v0 canonicalization rules:
 * - must match `^[0-9]+$`
 * - "0" is allowed
 * - otherwise: no leading zeros
 *
 * NOTE: This type is intentionally a branded string to prevent accidental mixing
 * with other strings in user code. The engine is responsible for validation.
 */
export type Revision = string & { readonly __brand: 'Revision' };

/**
 * An event signaling that the authoritative state for a given topic has changed.
 *
 * The engine uses this to decide whether a new snapshot should be fetched.
 * Transport layers (WebSocket, SSE, polling, etc.) produce these events and
 * deliver them via an {@link InvalidationSubscriber}.
 *
 * @example
 * ```ts
 * const event: InvalidationEvent = {
 *   topic: 'user-profile',
 *   revision: '42' as Revision,
 *   sourceId: 'server-1',
 *   timestampMs: Date.now(),
 * };
 * ```
 */
export interface InvalidationEvent {
  /** The topic this invalidation belongs to. */
  topic: Topic;
  /** The revision that the server has moved to. Must be a canonical decimal u64 string. */
  revision: Revision;
  /**
   * Optional identifier of the source that produced this event.
   * Useful for deduplication or debugging in multi-source setups.
   */
  sourceId?: string;
  /**
   * Optional timestamp (milliseconds since epoch) of when the event was produced.
   * The engine does not use this for ordering; it is informational only.
   */
  timestampMs?: number;
}

/**
 * A versioned wrapper around a snapshot payload.
 *
 * Returned by {@link SnapshotProvider.getSnapshot} and passed to
 * {@link SnapshotApplier.apply}. The `revision` field lets the engine
 * determine whether the snapshot is newer than the locally held state.
 *
 * @typeParam T - The application-specific snapshot data type.
 *
 * @example
 * ```ts
 * const envelope: SnapshotEnvelope<UserProfile> = {
 *   revision: '42' as Revision,
 *   data: { name: 'Alice', email: 'alice@example.com' },
 * };
 * ```
 */
export interface SnapshotEnvelope<T> {
  /** The revision this snapshot corresponds to. */
  revision: Revision;
  /** The application-specific snapshot payload. */
  data: T;
}

/**
 * A teardown function that removes a previously registered subscription.
 *
 * Calling it more than once is safe and has no additional effect.
 */
export type Unsubscribe = () => void;

/**
 * A transport-agnostic contract for subscribing to invalidation events.
 *
 * Implementations connect to a real-time channel (WebSocket, SSE, polling, etc.)
 * and forward incoming {@link InvalidationEvent}s to the provided handler.
 *
 * @example
 * ```ts
 * const subscriber: InvalidationSubscriber = {
 *   async subscribe(handler) {
 *     const ws = new WebSocket('wss://example.com/sync');
 *     ws.onmessage = (msg) => handler(JSON.parse(msg.data));
 *     return () => ws.close();
 *   },
 * };
 * ```
 */
export interface InvalidationSubscriber {
  /**
   * Registers a handler that will be called for each incoming invalidation event.
   *
   * @param handler - Callback invoked with each {@link InvalidationEvent}.
   * @returns A promise that resolves to an {@link Unsubscribe} teardown function.
   */
  subscribe(handler: (e: InvalidationEvent) => void): Promise<Unsubscribe>;
}

/**
 * Fetches the latest authoritative snapshot for a given topic.
 *
 * The engine calls {@link SnapshotProvider.getSnapshot | getSnapshot} whenever
 * a refresh is needed (after an invalidation or on initial start).
 *
 * @typeParam T - The application-specific snapshot data type.
 *
 * @example
 * ```ts
 * const provider: SnapshotProvider<UserProfile> = {
 *   async getSnapshot() {
 *     const res = await fetch('/api/user-profile/snapshot');
 *     return res.json(); // { revision, data }
 *   },
 * };
 * ```
 */
export interface SnapshotProvider<T> {
  /**
   * Retrieves the most recent snapshot from the authoritative source.
   *
   * @returns A promise resolving to a {@link SnapshotEnvelope} containing the
   *          revision and the snapshot payload.
   * @throws If the underlying fetch or data retrieval fails.
   */
  getSnapshot(): Promise<SnapshotEnvelope<T>>;
}

/**
 * Applies a fetched snapshot to local state.
 *
 * The engine calls {@link SnapshotApplier.apply | apply} after successfully
 * fetching a snapshot that is newer than the current local revision.
 *
 * @typeParam T - The application-specific snapshot data type.
 *
 * @example
 * ```ts
 * const applier: SnapshotApplier<UserProfile> = {
 *   apply({ revision, data }) {
 *     store.setState({ profile: data });
 *   },
 * };
 * ```
 */
export interface SnapshotApplier<T> {
  /**
   * Applies the given snapshot to local state.
   *
   * May be synchronous or asynchronous. If it returns a promise, the engine
   * will await it before advancing the local revision.
   *
   * @param snapshot - The {@link SnapshotEnvelope} containing the revision and payload to apply.
   * @throws If the local state update fails.
   */
  apply(snapshot: SnapshotEnvelope<T>): void | Promise<void>;
}

/**
 * A minimal structured logging interface used by the sync engine.
 *
 * Implementations can delegate to `console`, a logging library, or a
 * telemetry pipeline. The `extra` parameter carries structured context
 * (topic, revision, error, etc.) and is intentionally `unknown` so that
 * any serializable data can be passed through.
 *
 * @see {@link createConsoleLogger} for a ready-made console-based implementation.
 * @see {@link noopLogger} for a silent no-op implementation.
 * @see {@link tagLogger} for enriching log calls with static tags.
 */
export interface Logger {
  /**
   * Logs a debug-level message. Typically used for tracing sync lifecycle events.
   *
   * @param msg - A human-readable log message.
   * @param extra - Optional structured context for the log entry.
   */
  debug(msg: string, extra?: unknown): void;
  /**
   * Logs a warning-level message. Used for non-fatal issues such as retry attempts.
   *
   * @param msg - A human-readable log message.
   * @param extra - Optional structured context for the log entry.
   */
  warn(msg: string, extra?: unknown): void;
  /**
   * Logs an error-level message. Used for failures in the sync pipeline.
   *
   * @param msg - A human-readable log message.
   * @param extra - Optional structured context for the log entry.
   */
  error(msg: string, extra?: unknown): void;
}

/**
 * Identifies the phase of the sync lifecycle where an error occurred.
 *
 * Used in {@link SyncErrorContext} to let error handlers categorize and
 * route errors (e.g. alerting on `'protocol'` errors, retrying on `'getSnapshot'`).
 *
 * - `'start'`         - Error during initial engine startup.
 * - `'subscribe'`     - Error while subscribing to invalidation events.
 * - `'invalidation'`  - Error while processing an incoming invalidation event.
 * - `'refresh'`       - General error during a refresh cycle.
 * - `'getSnapshot'`   - Error while fetching the snapshot from the provider.
 * - `'apply'`         - Error while applying the snapshot to local state.
 * - `'protocol'`      - Protocol-level error (e.g. non-canonical revision, empty topic).
 * - `'throttle'`      - Error in the throttling/debounce layer.
 */
export type SyncPhase =
  | 'start'
  | 'subscribe'
  | 'invalidation'
  | 'refresh'
  | 'getSnapshot'
  | 'apply'
  | 'protocol'
  | 'throttle';

/**
 * Structured error context passed to the {@link RevisionSyncOptions.onError} callback.
 *
 * Contains enough information for error handlers to log, alert, or build
 * dashboards around sync failures. All fields beyond `phase` and `error`
 * are optional and populated on a best-effort basis.
 *
 * @example
 * ```ts
 * function handleSyncError(ctx: SyncErrorContext) {
 *   if (ctx.phase === 'getSnapshot' && ctx.willRetry) {
 *     console.warn(`Retry attempt ${ctx.attempt}, next in ${ctx.nextDelayMs}ms`);
 *   } else {
 *     reportToSentry(ctx.error, { phase: ctx.phase, topic: ctx.topic });
 *   }
 * }
 * ```
 */
export interface SyncErrorContext {
  /** The sync lifecycle phase where the error occurred. */
  phase: SyncPhase;
  /** The topic associated with this sync loop, if available. */
  topic?: Topic;
  /** The error value. May be an `Error` instance or any thrown value. */
  error: unknown;
  /**
   * Raw event payload when applicable (transport-specific).
   * Intentionally `unknown` to keep core transport-agnostic.
   */
  sourceEvent?: unknown;
  /**
   * The local revision at the time of the error.
   * Helpful for triage and metrics.
   */
  localRevision?: Revision;
  /**
   * The revision from the invalidation event that triggered the refresh, if applicable.
   */
  eventRevision?: Revision;
  /**
   * The revision from the snapshot that was being processed when the error occurred.
   */
  snapshotRevision?: Revision;
  /** The source identifier from the invalidation event, if available. */
  sourceId?: string;
  /**
   * The current retry attempt number (1-based).
   * Present when the error is reported by the retry wrapper.
   */
  attempt?: number;
  /**
   * Whether the engine or retry wrapper will attempt another try after this error.
   */
  willRetry?: boolean;
  /**
   * The delay in milliseconds before the next retry attempt.
   * Present when {@link willRetry} is `true`.
   */
  nextDelayMs?: number;
}
