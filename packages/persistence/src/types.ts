import type { SnapshotApplier, SnapshotEnvelope } from '@statesync/core';

// =============================================================================
// Core Interfaces
// =============================================================================

/**
 * Extended SnapshotApplier with dispose capability.
 *
 * Call dispose() when stopping sync to clean up pending debounce timers.
 */
export interface DisposablePersistenceApplier<T> extends SnapshotApplier<T> {
  /**
   * Cancels any pending debounced save operations.
   * Should be called when sync is stopped.
   */
  dispose(): void;

  /**
   * Returns true if there's a pending save operation.
   */
  hasPendingSave(): boolean;

  /**
   * Forces an immediate save of the last snapshot (if any pending).
   * Useful before dispose() if you want to ensure data is saved.
   */
  flush(): Promise<void>;

  /**
   * Subscribe to persistence events.
   */
  on<K extends keyof PersistenceEvents<T>>(event: K, handler: PersistenceEvents<T>[K]): () => void;

  /**
   * Get current persistence statistics.
   */
  getStats(): PersistenceStats;
}

/**
 * Metadata stored alongside the snapshot for integrity and management.
 */
export interface PersistedSnapshotMetadata {
  /**
   * Timestamp when snapshot was saved (ms since epoch).
   */
  savedAt: number;

  /**
   * Schema version for migration support.
   */
  schemaVersion: number;

  /**
   * Size of serialized data in bytes (before compression).
   */
  sizeBytes: number;

  /**
   * Whether data is compressed.
   */
  compressed: boolean;

  /**
   * Optional integrity hash (SHA-256 hex).
   */
  hash?: string;

  /**
   * Time-to-live in milliseconds. If set, cache expires after savedAt + ttlMs.
   */
  ttlMs?: number;
}

/**
 * Wrapper that includes metadata with the snapshot.
 */
export interface PersistedSnapshot<T> {
  snapshot: SnapshotEnvelope<T>;
  metadata: PersistedSnapshotMetadata;
}

/**
 * Abstract storage backend for persisting snapshots.
 *
 * Implementations must handle serialization/deserialization internally.
 * The save/load methods work with SnapshotEnvelope to preserve revision metadata.
 */
export interface StorageBackend<T> {
  /**
   * Save a snapshot to persistent storage.
   */
  save(snapshot: SnapshotEnvelope<T>): Promise<void>;

  /**
   * Load the most recent snapshot from persistent storage.
   * Returns null if no snapshot exists.
   */
  load(): Promise<SnapshotEnvelope<T> | null>;

  /**
   * Optional: Clear stored data.
   */
  clear?(): Promise<void>;
}

/**
 * Extended storage backend with metadata support.
 */
export interface StorageBackendWithMetadata<T> extends StorageBackend<T> {
  /**
   * Save snapshot with metadata.
   */
  saveWithMetadata(data: PersistedSnapshot<T>): Promise<void>;

  /**
   * Load snapshot with metadata.
   */
  loadWithMetadata(): Promise<PersistedSnapshot<T> | null>;

  /**
   * Get storage usage estimate in bytes.
   */
  getUsage?(): Promise<StorageUsage>;
}

/**
 * Storage usage information.
 */
export interface StorageUsage {
  /**
   * Used space in bytes.
   */
  used: number;

  /**
   * Available quota in bytes (if known).
   */
  quota?: number;

  /**
   * Usage percentage (0-100).
   */
  percentage?: number;
}

// =============================================================================
// Compression
// =============================================================================

/**
 * Compression adapter for reducing storage size.
 */
export interface CompressionAdapter {
  /**
   * Compress a string.
   */
  compress(data: string): string;

  /**
   * Decompress a string.
   */
  decompress(data: string): string;

  /**
   * Name of compression algorithm.
   */
  readonly algorithm: string;
}

// =============================================================================
// Migration
// =============================================================================

/**
 * Migration function for upgrading persisted data.
 */
export type MigrationFn<TOld, TNew> = (oldData: TOld) => TNew;

/**
 * Migration handler for schema versioning.
 */
export interface MigrationHandler<T> {
  /**
   * Current schema version.
   */
  currentVersion: number;

  /**
   * Migration functions keyed by source version.
   * Example: { 1: (v1Data) => v2Data, 2: (v2Data) => v3Data }
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  migrations: Record<number, MigrationFn<any, unknown>>;

  /**
   * Optional validator for migrated data.
   */
  validate?: (data: unknown) => data is T;
}

/**
 * Result of migration attempt.
 */
export interface MigrationResult<T> {
  success: boolean;
  data?: T;
  fromVersion: number;
  toVersion: number;
  error?: Error;
}

// =============================================================================
// Events & Observability
// =============================================================================

/**
 * Persistence event handlers.
 */
export interface PersistenceEvents<T> {
  /**
   * Emitted when save starts.
   */
  saveStart: (snapshot: SnapshotEnvelope<T>) => void;

  /**
   * Emitted when save completes successfully.
   */
  saveComplete: (snapshot: SnapshotEnvelope<T>, durationMs: number) => void;

  /**
   * Emitted when save fails.
   */
  saveError: (error: unknown, snapshot: SnapshotEnvelope<T>) => void;

  /**
   * Emitted when load completes.
   */
  loadComplete: (snapshot: SnapshotEnvelope<T> | null, durationMs: number) => void;

  /**
   * Emitted when cache expires due to TTL.
   */
  expired: (snapshot: SnapshotEnvelope<T>, age: number) => void;

  /**
   * Emitted when data is migrated.
   */
  migrated: (result: MigrationResult<T>) => void;

  /**
   * Emitted when storage is cleared.
   */
  cleared: () => void;
}

/**
 * Persistence statistics.
 */
export interface PersistenceStats {
  /**
   * Total number of saves.
   */
  saveCount: number;

  /**
   * Number of failed saves.
   */
  saveErrorCount: number;

  /**
   * Total bytes saved.
   */
  totalBytesSaved: number;

  /**
   * Last save timestamp.
   */
  lastSaveAt: number | null;

  /**
   * Last save duration in ms.
   */
  lastSaveDurationMs: number | null;

  /**
   * Number of saves skipped due to throttling.
   */
  throttledCount: number;
}

// =============================================================================
// Error Handling
// =============================================================================

/**
 * Context provided to error handlers.
 */
export interface PersistenceErrorContext {
  operation: 'save' | 'load' | 'clear' | 'migrate';
  error: unknown;
  snapshot?: SnapshotEnvelope<unknown>;
  metadata?: PersistedSnapshotMetadata;
}

// =============================================================================
// Throttling Options
// =============================================================================

/**
 * Options for controlling save frequency.
 */
export interface SaveThrottlingOptions {
  /**
   * Debounce delay in ms. Waits for "silence" before saving.
   * Use for high-frequency updates where only final state matters.
   */
  debounceMs?: number;

  /**
   * Throttle interval in ms. Maximum one save per interval.
   * Use when you want periodic saves during continuous updates.
   */
  throttleMs?: number;

  /**
   * If true, save immediately on first update (before debounce/throttle).
   * Default: false (for persistence, we want to wait for debounce)
   */
  leading?: boolean;

  /**
   * Maximum time to wait before forcing a save (ms).
   * Prevents indefinite delay during continuous updates.
   */
  maxWaitMs?: number;
}

// =============================================================================
// Main Options
// =============================================================================

/**
 * Options for creating a persistence-enabled applier.
 */
export interface PersistenceApplierOptions<T> {
  /**
   * Storage backend to use for persistence.
   */
  storage: StorageBackend<T>;

  /**
   * Inner applier to delegate snapshot application to.
   */
  applier: {
    apply(snapshot: SnapshotEnvelope<T>): void | Promise<void>;
  };

  /**
   * Optional debounce for save operations (ms).
   * Prevents excessive writes during rapid updates.
   * @deprecated Use `throttling.debounceMs` instead.
   */
  debounceMs?: number;

  /**
   * Advanced throttling options.
   */
  throttling?: SaveThrottlingOptions;

  /**
   * Optional error handler for persistence operations.
   * Called when save/load fails but does not prevent the inner applier from working.
   */
  onPersistenceError?: (context: PersistenceErrorContext) => void;

  /**
   * Schema version for migration support.
   * Default: 1
   */
  schemaVersion?: number;

  /**
   * Time-to-live for cached data in ms.
   * Expired data will not be loaded.
   */
  ttlMs?: number;

  /**
   * Optional compression adapter.
   */
  compression?: CompressionAdapter;

  /**
   * Enable integrity hash verification.
   * Default: false
   */
  enableHash?: boolean;

  /**
   * Enable cross-tab synchronization via BroadcastChannel.
   */
  crossTabSync?: CrossTabSyncOptions;
}

/**
 * Options for cross-tab synchronization.
 */
export interface CrossTabSyncOptions {
  /**
   * Channel name for BroadcastChannel.
   */
  channelName: string;

  /**
   * If true, apply updates from other tabs.
   * Default: true
   */
  receiveUpdates?: boolean;

  /**
   * If true, broadcast saves to other tabs.
   * Default: true
   */
  broadcastSaves?: boolean;
}

/**
 * Options for loading persisted snapshots.
 */
export interface LoadOptions<T> {
  /**
   * Migration handler for schema versioning.
   */
  migration?: MigrationHandler<T>;

  /**
   * If true, validate data against schema.
   * Default: false
   */
  validate?: boolean;

  /**
   * Custom validator function.
   */
  validator?: (data: unknown) => data is T;

  /**
   * If true, ignore TTL expiration.
   * Default: false
   */
  ignoreTTL?: boolean;

  /**
   * If true, verify integrity hash.
   * Default: false
   */
  verifyHash?: boolean;
}
