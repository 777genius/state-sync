import type { SnapshotApplier, SnapshotEnvelope } from '@statesync/core';

// =============================================================================
// Core Interfaces
// =============================================================================

/**
 * Extended {@link SnapshotApplier} with lifecycle management for persistence.
 *
 * Wraps a standard applier with automatic save-to-storage behavior, throttling/debouncing,
 * event subscriptions, and cross-tab synchronization. Call {@link dispose} when stopping
 * sync to clean up pending debounce timers, event listeners, and BroadcastChannel connections.
 *
 * @typeParam T - The shape of the application state being persisted.
 */
export interface DisposablePersistenceApplier<T> extends SnapshotApplier<T> {
  /**
   * Cancels any pending debounced/throttled save operations and releases all
   * internal resources (timers, event listeners, BroadcastChannel).
   *
   * After calling dispose, the applier becomes inert -- subsequent calls to
   * {@link apply}, {@link flush}, and event subscriptions are no-ops.
   *
   * Should be called when sync is stopped to prevent memory leaks.
   */
  dispose(): void;

  /**
   * Returns `true` if there is a pending save operation that has been scheduled
   * but not yet written to storage.
   *
   * @returns Whether a save is currently queued by the throttle/debounce handler.
   */
  hasPendingSave(): boolean;

  /**
   * Forces an immediate save of the most recently queued snapshot (if any).
   *
   * Useful before calling {@link dispose} to ensure no data is lost.
   * Resolves immediately if there is no pending save.
   *
   * @returns A promise that resolves when the flush completes (or immediately if nothing is pending).
   */
  flush(): Promise<void>;

  /**
   * Subscribe to a persistence lifecycle event.
   *
   * @param event - The event name to listen for (e.g., `'saveComplete'`, `'saveError'`).
   * @param handler - The callback invoked when the event fires.
   * @returns An unsubscribe function. Call it to remove the listener.
   *
   * @example
   * ```typescript
   * const unsub = applier.on('saveComplete', (snapshot, durationMs) => {
   *   console.log(`Saved revision ${snapshot.revision} in ${durationMs}ms`);
   * });
   *
   * // Later:
   * unsub();
   * ```
   */
  on<K extends keyof PersistenceEvents<T>>(event: K, handler: PersistenceEvents<T>[K]): () => void;

  /**
   * Returns a snapshot of the current persistence statistics.
   *
   * @returns A copy of the current {@link PersistenceStats} including save counts,
   *   error counts, byte totals, and throttle metrics.
   */
  getStats(): PersistenceStats;
}

/**
 * Metadata stored alongside a persisted snapshot for integrity checking,
 * expiration management, and schema migration.
 *
 * This metadata is written to storage by backends that implement
 * {@link StorageBackendWithMetadata} and is used during load to decide
 * whether the snapshot is still valid.
 */
export interface PersistedSnapshotMetadata {
  /**
   * Timestamp when the snapshot was saved, in milliseconds since the Unix epoch.
   *
   * Used together with {@link ttlMs} to determine cache expiration.
   */
  savedAt: number;

  /**
   * Schema version number at the time the snapshot was saved.
   *
   * Compared against the current version during load to determine whether
   * data migration is needed. Versions are sequential positive integers.
   */
  schemaVersion: number;

  /**
   * Size of the serialized JSON data in bytes, measured **before** compression.
   *
   * Useful for observability and storage quota estimation.
   */
  sizeBytes: number;

  /**
   * Whether the snapshot data was compressed before storage.
   *
   * When `true`, the data must be decompressed using the same
   * {@link CompressionAdapter} that was used during save.
   */
  compressed: boolean;

  /**
   * Optional integrity hash of the serialized (and possibly compressed) data.
   *
   * Computed using a non-cryptographic hash function. Verified during load
   * when the `verifyHash` option is enabled in {@link LoadOptions}.
   */
  hash?: string;

  /**
   * Time-to-live in milliseconds. When set, the cached snapshot is considered
   * expired if `Date.now() - savedAt > ttlMs`.
   *
   * Expired snapshots are discarded during load unless `ignoreTTL` is set
   * in {@link LoadOptions}.
   */
  ttlMs?: number;
}

/**
 * A persisted snapshot bundled with its associated metadata.
 *
 * This is the unit of storage for backends that support metadata
 * ({@link StorageBackendWithMetadata}). It pairs the actual state envelope
 * with bookkeeping information (timestamps, schema version, compression flag, etc.).
 *
 * @typeParam T - The shape of the application state.
 */
export interface PersistedSnapshot<T> {
  /** The snapshot envelope containing the revision and state data. */
  snapshot: SnapshotEnvelope<T>;

  /** Metadata describing when and how the snapshot was persisted. */
  metadata: PersistedSnapshotMetadata;
}

/**
 * Abstract storage backend for persisting snapshots.
 *
 * Implementations must handle serialization/deserialization internally.
 * The save/load methods work with {@link SnapshotEnvelope} to preserve
 * revision metadata alongside the application state.
 *
 * Built-in implementations include localStorage, sessionStorage, IndexedDB,
 * and an in-memory backend for testing.
 *
 * @typeParam T - The shape of the application state.
 *
 * @example
 * ```typescript
 * const storage: StorageBackend<MyState> = createLocalStorageBackend({
 *   key: 'my-app-state',
 * });
 * ```
 */
export interface StorageBackend<T> {
  /**
   * Save a snapshot to persistent storage.
   *
   * @param snapshot - The snapshot envelope to persist.
   * @returns A promise that resolves when the write is complete.
   */
  save(snapshot: SnapshotEnvelope<T>): Promise<void>;

  /**
   * Load the most recent snapshot from persistent storage.
   *
   * @returns The stored snapshot, or `null` if no snapshot has been persisted yet.
   */
  load(): Promise<SnapshotEnvelope<T> | null>;

  /**
   * Remove all persisted data from this backend's storage key.
   *
   * This method is optional -- not all backends support clearing.
   *
   * @returns A promise that resolves when the data has been removed.
   */
  clear?(): Promise<void>;
}

/**
 * Extended storage backend that persists metadata alongside snapshots.
 *
 * Backends implementing this interface support schema versioning, TTL expiration,
 * integrity hashing, and storage usage reporting.
 *
 * The persistence applier automatically detects this interface via duck typing
 * and uses the metadata-aware methods when available.
 *
 * @typeParam T - The shape of the application state.
 */
export interface StorageBackendWithMetadata<T> extends StorageBackend<T> {
  /**
   * Save a snapshot together with its metadata to persistent storage.
   *
   * @param data - The snapshot and metadata bundle to persist.
   * @returns A promise that resolves when the write is complete.
   */
  saveWithMetadata(data: PersistedSnapshot<T>): Promise<void>;

  /**
   * Load the most recent snapshot along with its metadata.
   *
   * @returns The stored snapshot and metadata bundle, or `null` if nothing is persisted.
   */
  loadWithMetadata(): Promise<PersistedSnapshot<T> | null>;

  /**
   * Estimate current storage usage for this backend.
   *
   * This method is optional -- not all backends can report usage.
   *
   * @returns Storage usage information including bytes used and quota (if available).
   */
  getUsage?(): Promise<StorageUsage>;
}

/**
 * Storage usage information reported by a backend.
 *
 * Provides insight into how much storage is consumed and what the browser quota is,
 * useful for monitoring and alerting before quota is exceeded.
 */
export interface StorageUsage {
  /**
   * Number of bytes currently used by this backend's stored data.
   */
  used: number;

  /**
   * Total storage quota in bytes, if the browser reports it.
   *
   * May be `undefined` if the backend or environment does not expose quota information.
   */
  quota?: number;

  /**
   * Usage as a percentage (0--100), calculated as `(used / quota) * 100`.
   *
   * Only present when {@link quota} is known.
   */
  percentage?: number;
}

// =============================================================================
// Compression
// =============================================================================

/**
 * Adapter for compressing and decompressing serialized snapshot data.
 *
 * Compression is applied **after** JSON serialization and **before** writing to storage,
 * reducing the size of persisted data. The same adapter must be used for both
 * compression and decompression; mismatched adapters will produce corrupt data.
 *
 * Built-in adapters: {@link createLZCompressionAdapter}, {@link createLZStringAdapter},
 * {@link createNoCompressionAdapter}, {@link createBase64Adapter}.
 *
 * @example
 * ```typescript
 * const adapter: CompressionAdapter = {
 *   algorithm: 'custom-lz',
 *   compress: (data) => myCompress(data),
 *   decompress: (data) => myDecompress(data),
 * };
 * ```
 */
export interface CompressionAdapter {
  /**
   * Compress a serialized JSON string into a shorter representation.
   *
   * @param data - The raw JSON string to compress.
   * @returns The compressed string, safe for storage in the target backend.
   */
  compress(data: string): string;

  /**
   * Decompress a string previously produced by {@link compress}.
   *
   * @param data - The compressed string to decompress.
   * @returns The original JSON string.
   */
  decompress(data: string): string;

  /**
   * Human-readable name of the compression algorithm (e.g., `'lz'`, `'lz-string'`, `'none'`).
   *
   * Used for logging and diagnostics.
   */
  readonly algorithm: string;
}

// =============================================================================
// Migration
// =============================================================================

/**
 * A pure function that transforms persisted data from one schema version to the next.
 *
 * Migration functions are applied sequentially -- e.g., `v1 -> v2 -> v3` --
 * so each function only needs to handle a single version step.
 *
 * @typeParam TOld - The shape of the data in the source schema version.
 * @typeParam TNew - The shape of the data in the target schema version.
 *
 * @param oldData - The data in the source format.
 * @returns The transformed data in the target format.
 */
export type MigrationFn<TOld, TNew> = (oldData: TOld) => TNew;

/**
 * Configuration for schema-versioned data migration.
 *
 * Defines the current schema version, a map of migration functions, and an
 * optional type-guard validator. During load, the persistence applier compares
 * the stored schema version against {@link currentVersion} and applies the
 * necessary migration functions in sequence.
 *
 * @typeParam T - The shape of the application state in the **current** schema version.
 *
 * @example
 * ```typescript
 * const handler: MigrationHandler<AppStateV3> = {
 *   currentVersion: 3,
 *   migrations: {
 *     1: (v1) => ({ ...v1, newField: 'default' }),
 *     2: (v2) => ({ ...v2, renamedField: v2.oldField }),
 *   },
 *   validate: (data): data is AppStateV3 => 'renamedField' in (data as object),
 * };
 * ```
 */
export interface MigrationHandler<T> {
  /**
   * The schema version that the current application code expects.
   *
   * Must be a positive integer. All persisted data with a lower version will
   * be migrated up to this version during load.
   */
  currentVersion: number;

  /**
   * A record of migration functions keyed by **source** version number.
   *
   * Each entry transforms data from version `N` to version `N + 1`.
   * For example, `{ 1: fn }` migrates v1 data to v2.
   *
   * @example
   * ```typescript
   * migrations: {
   *   1: (v1Data) => ({ ...v1Data, newField: 'default' }),  // v1 -> v2
   *   2: (v2Data) => ({ ...v2Data, renamed: v2Data.old }),   // v2 -> v3
   * }
   * ```
   */
  // biome-ignore lint/suspicious/noExplicitAny: migrations need to accept any version
  migrations: Record<number, MigrationFn<any, unknown>>;

  /**
   * Optional type-guard function to validate the fully migrated data.
   *
   * Called after all migration steps complete. If it returns `false`,
   * the migration is considered failed and the persisted data is discarded.
   *
   * @param data - The data after all migrations have been applied.
   * @returns `true` if the data matches the expected shape `T`.
   */
  validate?: (data: unknown) => data is T;
}

/**
 * The outcome of a data migration attempt.
 *
 * Contains the migrated data on success, or an {@link Error} describing what
 * went wrong on failure. Always includes the version range that was attempted.
 *
 * @typeParam T - The shape of the application state in the target schema version.
 */
export interface MigrationResult<T> {
  /** Whether the migration completed successfully. */
  success: boolean;

  /**
   * The migrated data in the target schema format.
   *
   * Only present when {@link success} is `true`.
   */
  data?: T;

  /** The schema version of the data **before** migration was attempted. */
  fromVersion: number;

  /** The target schema version the migration aimed to reach. */
  toVersion: number;

  /**
   * The error that caused the migration to fail.
   *
   * Only present when {@link success} is `false`.
   */
  error?: Error;
}

// =============================================================================
// Events & Observability
// =============================================================================

/**
 * Map of persistence lifecycle event names to their handler signatures.
 *
 * Subscribe to these events via {@link DisposablePersistenceApplier.on} to
 * observe save/load activity, errors, and cache management events.
 *
 * @typeParam T - The shape of the application state.
 */
export interface PersistenceEvents<T> {
  /**
   * Emitted when a save operation begins, before data is written to storage.
   *
   * @param snapshot - The snapshot about to be persisted.
   */
  saveStart: (snapshot: SnapshotEnvelope<T>) => void;

  /**
   * Emitted when a save operation completes successfully.
   *
   * @param snapshot - The snapshot that was persisted.
   * @param durationMs - Wall-clock time the save took, in milliseconds.
   */
  saveComplete: (snapshot: SnapshotEnvelope<T>, durationMs: number) => void;

  /**
   * Emitted when a save operation fails.
   *
   * The inner applier still receives the snapshot -- only persistence is affected.
   *
   * @param error - The error thrown by the storage backend.
   * @param snapshot - The snapshot that failed to persist.
   */
  saveError: (error: unknown, snapshot: SnapshotEnvelope<T>) => void;

  /**
   * Emitted when a load operation completes (successfully or with no data).
   *
   * @param snapshot - The loaded snapshot, or `null` if nothing was stored.
   * @param durationMs - Wall-clock time the load took, in milliseconds.
   */
  loadComplete: (snapshot: SnapshotEnvelope<T> | null, durationMs: number) => void;

  /**
   * Emitted when a cached snapshot is discarded because its TTL has expired.
   *
   * @param snapshot - The expired snapshot.
   * @param age - How old the snapshot was in milliseconds when it expired.
   */
  expired: (snapshot: SnapshotEnvelope<T>, age: number) => void;

  /**
   * Emitted when persisted data is successfully migrated to a newer schema version.
   *
   * @param result - The migration result including source/target versions and migrated data.
   */
  migrated: (result: MigrationResult<T>) => void;

  /**
   * Emitted when persisted data is cleared from storage.
   */
  cleared: () => void;
}

/**
 * Cumulative statistics about persistence operations.
 *
 * Retrieved via {@link DisposablePersistenceApplier.getStats}. Useful for
 * monitoring, logging, and performance tuning of throttle/debounce settings.
 */
export interface PersistenceStats {
  /**
   * Total number of successful save operations since the applier was created.
   */
  saveCount: number;

  /**
   * Total number of save operations that failed (threw an error).
   */
  saveErrorCount: number;

  /**
   * Cumulative size in bytes of all data saved (measured before compression).
   */
  totalBytesSaved: number;

  /**
   * Timestamp of the most recent successful save (ms since epoch),
   * or `null` if no save has completed yet.
   */
  lastSaveAt: number | null;

  /**
   * Duration of the most recent successful save in milliseconds,
   * or `null` if no save has completed yet.
   */
  lastSaveDurationMs: number | null;

  /**
   * Number of save invocations that were skipped because the throttle/debounce
   * handler determined a save was already scheduled or too recent.
   */
  throttledCount: number;
}

// =============================================================================
// Error Handling
// =============================================================================

/**
 * Contextual information provided to the `onPersistenceError` callback when
 * a persistence operation fails.
 *
 * Includes the failing operation name, the error, and (when available) the
 * snapshot and metadata involved. Useful for logging, metrics, and diagnostics.
 */
export interface PersistenceErrorContext {
  /**
   * The persistence operation that failed.
   *
   * - `'save'` -- writing a snapshot to storage
   * - `'load'` -- reading a snapshot from storage or validation failure
   * - `'clear'` -- removing persisted data
   * - `'migrate'` -- transforming data between schema versions
   */
  operation: 'save' | 'load' | 'clear' | 'migrate';

  /** The error that was thrown or created during the operation. */
  error: unknown;

  /** The snapshot involved in the failed operation, if available. */
  snapshot?: SnapshotEnvelope<unknown>;

  /** The metadata associated with the snapshot, if available. */
  metadata?: PersistedSnapshotMetadata;
}

// =============================================================================
// Throttling Options
// =============================================================================

/**
 * Options for controlling how frequently snapshots are saved to storage.
 *
 * Supports debouncing, throttling, leading-edge saves, and a maximum wait cap.
 * These options help balance write frequency against data freshness, especially
 * during rapid or continuous state updates.
 *
 * @example
 * ```typescript
 * const throttling: SaveThrottlingOptions = {
 *   debounceMs: 300,    // Wait 300ms of silence before saving
 *   maxWaitMs: 2000,    // But never wait more than 2s total
 * };
 * ```
 */
export interface SaveThrottlingOptions {
  /**
   * Debounce delay in milliseconds. The save is postponed until no new
   * snapshots arrive for this duration ("wait for silence").
   *
   * Best for high-frequency updates where only the final state matters
   * (e.g., text input, slider dragging).
   */
  debounceMs?: number;

  /**
   * Throttle interval in milliseconds. At most one save will occur per
   * interval, regardless of how many snapshots arrive.
   *
   * Best when you want periodic saves during continuous updates
   * (e.g., real-time collaboration).
   */
  throttleMs?: number;

  /**
   * If `true`, the very first update triggers an immediate save before
   * the debounce/throttle timer starts.
   *
   * @defaultValue `false`
   */
  leading?: boolean;

  /**
   * Maximum time in milliseconds to wait before forcing a save, even if
   * debounce keeps resetting. Prevents indefinite delay during continuous
   * updates.
   *
   * Only meaningful when {@link debounceMs} is also set.
   */
  maxWaitMs?: number;
}

// =============================================================================
// Main Options
// =============================================================================

/**
 * Configuration options for {@link createPersistenceApplier}.
 *
 * Controls which storage backend to use, how saves are throttled, schema
 * versioning, compression, integrity checking, cross-tab sync, and error handling.
 *
 * @typeParam T - The shape of the application state being persisted.
 *
 * @example
 * ```typescript
 * const options: PersistenceApplierOptions<MyState> = {
 *   storage: createLocalStorageBackend({ key: 'my-state' }),
 *   applier: myInnerApplier,
 *   throttling: { debounceMs: 300, maxWaitMs: 2000 },
 *   schemaVersion: 3,
 *   ttlMs: 24 * 60 * 60 * 1000,
 *   compression: createLZCompressionAdapter(),
 * };
 * ```
 */
export interface PersistenceApplierOptions<T> {
  /**
   * The storage backend used to read and write snapshots.
   */
  storage: StorageBackend<T>;

  /**
   * The inner applier to which snapshot application is delegated.
   *
   * The persistence applier always forwards snapshots to this applier first,
   * even if the subsequent storage write fails.
   */
  applier: {
    apply(snapshot: SnapshotEnvelope<T>): void | Promise<void>;
  };

  /**
   * Simple debounce delay in milliseconds for save operations.
   *
   * @deprecated Use {@link throttling}.debounceMs instead for more control.
   */
  debounceMs?: number;

  /**
   * Advanced throttling and debouncing options for save operations.
   *
   * When provided, these take precedence over the deprecated {@link debounceMs}.
   */
  throttling?: SaveThrottlingOptions;

  /**
   * Callback invoked when a persistence operation fails.
   *
   * Errors in persistence do **not** prevent the inner applier from receiving
   * snapshots. Use this callback for logging, metrics, or user notification.
   *
   * @param context - Details about the failed operation.
   */
  onPersistenceError?: (context: PersistenceErrorContext) => void;

  /**
   * The current schema version of the application state.
   *
   * Stored in metadata alongside each snapshot. During load, the stored version
   * is compared to this value to determine if migration is needed.
   *
   * @defaultValue `1`
   */
  schemaVersion?: number;

  /**
   * Time-to-live for cached snapshots, in milliseconds.
   *
   * When set, snapshots older than this duration are discarded during load.
   * Set to `undefined` for no expiration.
   */
  ttlMs?: number;

  /**
   * Compression adapter to use for reducing the size of persisted data.
   *
   * Applied after JSON serialization and before writing to storage.
   * The same adapter must be used for both saving and loading.
   */
  compression?: CompressionAdapter;

  /**
   * Whether to compute and store an integrity hash with each save.
   *
   * When enabled, a non-cryptographic hash is stored in metadata and can
   * be verified during load via {@link LoadOptions.verifyHash}.
   *
   * @defaultValue `false`
   */
  enableHash?: boolean;

  /**
   * Options for cross-tab synchronization via the BroadcastChannel API.
   *
   * When provided, saves are broadcast to other tabs and incoming snapshots
   * from other tabs are applied to the inner applier.
   */
  crossTabSync?: CrossTabSyncOptions;
}

/**
 * Options for cross-tab state synchronization via the BroadcastChannel API.
 *
 * Controls the channel name and whether this tab sends and/or receives updates.
 */
export interface CrossTabSyncOptions {
  /**
   * The name of the BroadcastChannel used for inter-tab communication.
   *
   * All tabs that should synchronize state must use the same channel name.
   * Convention: `'state-sync:<topic>'`.
   */
  channelName: string;

  /**
   * Whether this tab should apply snapshots received from other tabs.
   *
   * @defaultValue `true`
   */
  receiveUpdates?: boolean;

  /**
   * Whether this tab should broadcast its saves to other tabs.
   *
   * @defaultValue `true`
   */
  broadcastSaves?: boolean;
}

/**
 * Options for {@link loadPersistedSnapshot} controlling migration, validation,
 * TTL enforcement, and integrity checking.
 *
 * @typeParam T - The shape of the application state after any migrations.
 */
export interface LoadOptions<T> {
  /**
   * Migration handler for upgrading persisted data to the current schema version.
   *
   * If the stored schema version differs from the handler's
   * {@link MigrationHandler.currentVersion}, the appropriate migration
   * functions are applied in sequence.
   */
  migration?: MigrationHandler<T>;

  /**
   * Whether to run the migration handler's built-in validator on the loaded data.
   *
   * @defaultValue `false`
   */
  validate?: boolean;

  /**
   * A custom type-guard function to validate the loaded (and possibly migrated) data.
   *
   * If provided and the function returns `false`, the snapshot is discarded.
   *
   * @param data - The deserialized snapshot data to validate.
   * @returns `true` if the data matches the expected shape `T`.
   */
  validator?: (data: unknown) => data is T;

  /**
   * If `true`, load the snapshot even if its TTL has expired.
   *
   * Useful for "best-effort" hydration where stale data is better than no data.
   *
   * @defaultValue `false`
   */
  ignoreTTL?: boolean;

  /**
   * If `true`, verify the stored integrity hash against the loaded data.
   *
   * When the hash does not match, the snapshot is discarded and an error
   * is emitted via the `onPersistenceError` callback.
   *
   * @defaultValue `false`
   */
  verifyHash?: boolean;
}
