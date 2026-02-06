import { isCanonicalRevision, type SnapshotEnvelope } from '@statesync/core';
import { type CrossTabSync, createCrossTabSync } from './cross-tab';
import { migrateData } from './migration';
import type {
  CrossTabSyncOptions,
  DisposablePersistenceApplier,
  LoadOptions,
  MigrationHandler,
  PersistedSnapshotMetadata,
  PersistenceApplierOptions,
  PersistenceErrorContext,
  PersistenceEvents,
  PersistenceStats,
  SaveThrottlingOptions,
  StorageBackend,
  StorageBackendWithMetadata,
} from './types';

// =============================================================================
// Hash Utilities
// =============================================================================

/**
 * Simple hash function for integrity checking (non-cryptographic).
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// =============================================================================
// Throttle/Debounce Handler
// =============================================================================

interface ThrottleDebounceHandler<T> {
  schedule(snapshot: SnapshotEnvelope<T>): void;
  flush(): Promise<void>;
  hasPending(): boolean;
  dispose(): void;
  getThrottledCount(): number;
}

function createThrottleDebounceHandler<T>(
  onSave: (snapshot: SnapshotEnvelope<T>) => Promise<void>,
  options: SaveThrottlingOptions,
): ThrottleDebounceHandler<T> {
  // For persistence, default leading to false (wait for debounce before first save)
  const { debounceMs, throttleMs, leading = false, maxWaitMs } = options;

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let maxWaitTimer: ReturnType<typeof setTimeout> | null = null;
  let lastSaveTime = 0;
  let pendingSnapshot: SnapshotEnvelope<T> | null = null;
  let isFirstCall = true;
  let disposed = false;
  let throttledCount = 0;

  const clearTimers = (): void => {
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    if (maxWaitTimer !== null) {
      clearTimeout(maxWaitTimer);
      maxWaitTimer = null;
    }
  };

  const doSave = async (snapshot: SnapshotEnvelope<T>): Promise<void> => {
    clearTimers();
    pendingSnapshot = null;
    lastSaveTime = Date.now();
    isFirstCall = false;
    await onSave(snapshot);
  };

  const scheduleDebounce = (snapshot: SnapshotEnvelope<T>, delay: number): void => {
    pendingSnapshot = snapshot;

    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      if (pendingSnapshot && !disposed) {
        doSave(pendingSnapshot);
      }
    }, delay);

    // Set up maxWait timer if configured and not already running
    if (maxWaitMs !== undefined && maxWaitMs > 0 && maxWaitTimer === null) {
      maxWaitTimer = setTimeout(() => {
        maxWaitTimer = null;
        if (pendingSnapshot && !disposed) {
          doSave(pendingSnapshot);
        }
      }, maxWaitMs);
    }
  };

  return {
    schedule(snapshot: SnapshotEnvelope<T>): void {
      if (disposed) return;

      const now = Date.now();

      // Handle leading edge
      if (leading && isFirstCall) {
        doSave(snapshot);
        return;
      }

      // Throttle check
      if (throttleMs !== undefined && throttleMs > 0) {
        const timeSinceLastSave = now - lastSaveTime;
        if (timeSinceLastSave < throttleMs) {
          throttledCount++;
          // Schedule for after throttle period
          const delay = debounceMs ?? throttleMs - timeSinceLastSave;
          scheduleDebounce(snapshot, delay);
          return;
        }
      }

      // Debounce or immediate
      if (debounceMs !== undefined && debounceMs > 0) {
        scheduleDebounce(snapshot, debounceMs);
      } else {
        doSave(snapshot);
      }
    },

    async flush(): Promise<void> {
      if (disposed || !pendingSnapshot) return;
      const snapshot = pendingSnapshot;
      clearTimers();
      pendingSnapshot = null;
      await onSave(snapshot);
    },

    hasPending(): boolean {
      return pendingSnapshot !== null;
    },

    dispose(): void {
      if (disposed) return;
      disposed = true;
      clearTimers();
      pendingSnapshot = null;
    },

    getThrottledCount(): number {
      return throttledCount;
    },
  };
}

// =============================================================================
// Event Emitter
// =============================================================================

// biome-ignore lint/suspicious/noExplicitAny: Generic event handler type
type AnyHandler = (...args: any[]) => void;

function createEventEmitter<T>(): {
  on<K extends keyof PersistenceEvents<T>>(event: K, handler: PersistenceEvents<T>[K]): () => void;
  emit<K extends keyof PersistenceEvents<T>>(
    event: K,
    ...args: Parameters<PersistenceEvents<T>[K]>
  ): void;
  dispose(): void;
} {
  const handlers = new Map<keyof PersistenceEvents<T>, Set<AnyHandler>>();

  return {
    on<K extends keyof PersistenceEvents<T>>(
      event: K,
      handler: PersistenceEvents<T>[K],
    ): () => void {
      if (!handlers.has(event)) {
        handlers.set(event, new Set());
      }
      handlers.get(event)?.add(handler as AnyHandler);

      return () => {
        handlers.get(event)?.delete(handler as AnyHandler);
      };
    },

    emit<K extends keyof PersistenceEvents<T>>(
      event: K,
      ...args: Parameters<PersistenceEvents<T>[K]>
    ): void {
      const eventHandlers = handlers.get(event);
      if (!eventHandlers) return;

      for (const handler of eventHandlers) {
        try {
          handler(...args);
        } catch {
          // Ignore errors in event handlers
        }
      }
    },

    dispose(): void {
      handlers.clear();
    },
  };
}

// =============================================================================
// Persistence Applier
// =============================================================================

/**
 * Wraps an applier with automatic persistence.
 *
 * On every apply(), the snapshot is saved to storage (with optional throttle/debounce).
 * The inner applier is always called, even if persistence fails.
 *
 * IMPORTANT: Call dispose() when stopping sync to clean up pending timers.
 *
 * @example
 * ```typescript
 * const applier = createPersistenceApplier({
 *   storage: createLocalStorageBackend({ key: 'my-state' }),
 *   applier: createPiniaSnapshotApplier(useMyStore()),
 *   throttling: { debounceMs: 300, maxWaitMs: 2000 },
 *   schemaVersion: 2,
 *   ttlMs: 24 * 60 * 60 * 1000, // 24 hours
 * });
 *
 * // Subscribe to events
 * const unsub = applier.on('saveComplete', (snapshot, duration) => {
 *   console.log(`Saved revision ${snapshot.revision} in ${duration}ms`);
 * });
 *
 * // Get stats
 * console.log(applier.getStats());
 *
 * // When stopping:
 * await applier.flush(); // Optional: save pending data
 * applier.dispose();
 * ```
 */
export function createPersistenceApplier<T>(
  options: PersistenceApplierOptions<T>,
): DisposablePersistenceApplier<T> {
  const {
    storage,
    applier,
    debounceMs,
    throttling,
    onPersistenceError,
    schemaVersion = 1,
    ttlMs,
    compression,
    enableHash = false,
    crossTabSync,
  } = options;

  // Merge deprecated debounceMs with new throttling options
  const throttleOptions: SaveThrottlingOptions = {
    ...throttling,
    debounceMs: throttling?.debounceMs ?? debounceMs,
  };

  let disposed = false;

  // Stats
  const stats: PersistenceStats = {
    saveCount: 0,
    saveErrorCount: 0,
    totalBytesSaved: 0,
    lastSaveAt: null,
    lastSaveDurationMs: null,
    throttledCount: 0,
  };

  // Event emitter
  const events = createEventEmitter<T>();

  // Cross-tab sync
  let crossTab: CrossTabSync<T> | null = null;
  if (crossTabSync) {
    crossTab = createCrossTabSync<T>({
      ...crossTabSync,
      onSnapshot: (snapshot) => {
        // Apply snapshots from other tabs
        if (!disposed) {
          applier.apply(snapshot);
        }
      },
    });
  }

  // Error handler
  const emitError = (context: PersistenceErrorContext): void => {
    try {
      onPersistenceError?.(context);
    } catch {
      // Ignore errors from error handler
    }
  };

  // Save with metadata
  const doSave = async (snapshot: SnapshotEnvelope<T>): Promise<void> => {
    if (disposed) return;

    const startTime = Date.now();
    events.emit('saveStart', snapshot);

    try {
      let dataToStore = JSON.stringify(snapshot);
      const originalSize = dataToStore.length;

      // Compress if adapter provided
      if (compression) {
        dataToStore = compression.compress(dataToStore);
      }

      // Create metadata
      const metadata: PersistedSnapshotMetadata = {
        savedAt: Date.now(),
        schemaVersion,
        sizeBytes: originalSize,
        compressed: !!compression,
        ttlMs,
      };

      // Add hash if enabled
      if (enableHash) {
        metadata.hash = simpleHash(dataToStore);
      }

      // Save with metadata if supported, otherwise plain save
      if (isStorageWithMetadata(storage)) {
        await storage.saveWithMetadata({
          snapshot,
          metadata,
        });
      } else {
        await storage.save(snapshot);
      }

      // Update stats
      const duration = Date.now() - startTime;
      stats.saveCount++;
      stats.totalBytesSaved += originalSize;
      stats.lastSaveAt = Date.now();
      stats.lastSaveDurationMs = duration;

      events.emit('saveComplete', snapshot, duration);

      // Broadcast to other tabs
      crossTab?.broadcast(snapshot);
    } catch (error) {
      stats.saveErrorCount++;
      events.emit('saveError', error, snapshot);
      emitError({ operation: 'save', error, snapshot });
    }
  };

  // Throttle/debounce handler
  const handler = createThrottleDebounceHandler<T>(doSave, throttleOptions);

  return {
    async apply(snapshot: SnapshotEnvelope<T>): Promise<void> {
      if (disposed) return;
      await applier.apply(snapshot);
      handler.schedule(snapshot);
    },

    dispose(): void {
      if (disposed) return;
      disposed = true;
      handler.dispose();
      crossTab?.dispose();
      events.dispose();
    },

    hasPendingSave(): boolean {
      return handler.hasPending();
    },

    async flush(): Promise<void> {
      if (disposed) return;
      await handler.flush();
    },

    on<K extends keyof PersistenceEvents<T>>(
      event: K,
      eventHandler: PersistenceEvents<T>[K],
    ): () => void {
      return events.on(event, eventHandler);
    },

    getStats(): PersistenceStats {
      return {
        ...stats,
        throttledCount: handler.getThrottledCount(),
      };
    },
  };
}

// =============================================================================
// Load Persisted Snapshot
// =============================================================================

/**
 * Loads a persisted snapshot and applies it.
 *
 * Use this to hydrate state before starting sync.
 * Returns the loaded snapshot, or null if none exists or if validation fails.
 *
 * Features:
 * - Revision validation
 * - Schema migration
 * - TTL expiration check
 * - Optional integrity verification
 *
 * @example
 * ```typescript
 * const cached = await loadPersistedSnapshot(storage, applier, {
 *   migration: {
 *     currentVersion: 3,
 *     migrations: {
 *       1: (v1) => ({ ...v1, newField: 'default' }),
 *       2: (v2) => ({ ...v2, renamedField: v2.oldField }),
 *     },
 *   },
 * });
 *
 * if (cached) {
 *   console.log('Restored from cache, revision:', cached.revision);
 * }
 * ```
 */
export async function loadPersistedSnapshot<T>(
  storage: StorageBackend<T>,
  applier: { apply(snapshot: SnapshotEnvelope<T>): void | Promise<void> },
  onErrorOrOptions?: ((context: PersistenceErrorContext) => void) | LoadOptions<T>,
  loadOptions?: LoadOptions<T>,
): Promise<SnapshotEnvelope<T> | null> {
  // Handle overloaded parameters
  let onError: ((context: PersistenceErrorContext) => void) | undefined;
  let options: LoadOptions<T> = {};

  if (typeof onErrorOrOptions === 'function') {
    onError = onErrorOrOptions;
    options = loadOptions ?? {};
  } else if (onErrorOrOptions) {
    options = onErrorOrOptions;
  }

  const { migration, ignoreTTL = false, verifyHash = false, validator } = options;

  const emitError = (context: PersistenceErrorContext): void => {
    try {
      onError?.(context);
    } catch {
      // Ignore
    }
  };

  // Load snapshot
  let snapshot: SnapshotEnvelope<T> | null = null;
  let metadata: PersistedSnapshotMetadata | undefined;

  try {
    if (isStorageWithMetadata(storage)) {
      const persisted = await storage.loadWithMetadata();
      if (persisted) {
        snapshot = persisted.snapshot;
        metadata = persisted.metadata;
      }
    } else {
      snapshot = await storage.load();
    }
  } catch (error) {
    emitError({ operation: 'load', error });
    return null;
  }

  if (!snapshot) {
    return null;
  }

  // Check TTL expiration
  if (metadata?.ttlMs !== undefined && !ignoreTTL) {
    const age = Date.now() - metadata.savedAt;
    if (age > metadata.ttlMs) {
      emitError({
        operation: 'load',
        error: new Error(`Cache expired. Age: ${age}ms, TTL: ${metadata.ttlMs}ms`),
        snapshot,
        metadata,
      });
      return null;
    }
  }

  // Verify hash if enabled
  if (verifyHash && metadata?.hash) {
    const currentHash = simpleHash(JSON.stringify(snapshot));
    if (currentHash !== metadata.hash) {
      emitError({
        operation: 'load',
        error: new Error('Integrity check failed: hash mismatch'),
        snapshot,
        metadata,
      });
      return null;
    }
  }

  // Validate revision
  if (!isCanonicalRevision(snapshot.revision)) {
    emitError({
      operation: 'load',
      error: new Error(`Invalid cached revision: "${snapshot.revision}"`),
      snapshot,
      metadata,
    });
    return null;
  }

  // Handle migration
  if (migration && metadata) {
    const fromVersion = metadata.schemaVersion;
    const toVersion = migration.currentVersion;

    if (fromVersion !== toVersion) {
      const result = migrateData(snapshot.data, fromVersion, migration as MigrationHandler<T>);

      if (!result.success) {
        emitError({
          operation: 'migrate',
          error: result.error ?? new Error('Migration failed'),
          snapshot,
          metadata,
        });
        return null;
      }

      // Update snapshot with migrated data
      snapshot = {
        ...snapshot,
        data: result.data as T,
      };
    }
  }

  // Custom validation
  if (validator && !validator(snapshot.data)) {
    emitError({
      operation: 'load',
      error: new Error('Custom validation failed'),
      snapshot,
      metadata,
    });
    return null;
  }

  // Apply snapshot
  try {
    await applier.apply(snapshot);
  } catch (error) {
    emitError({
      operation: 'load',
      error,
      snapshot,
      metadata,
    });
    return null;
  }

  return snapshot;
}

// =============================================================================
// Type Guards
// =============================================================================

function isStorageWithMetadata<T>(
  storage: StorageBackend<T>,
): storage is StorageBackendWithMetadata<T> {
  return 'saveWithMetadata' in storage && 'loadWithMetadata' in storage;
}

// =============================================================================
// Factory Utilities
// =============================================================================

/**
 * Creates a persistence applier with common defaults.
 *
 * @example
 * ```typescript
 * const applier = createPersistenceApplierWithDefaults({
 *   storage: createLocalStorageBackend({ key: 'my-state' }),
 *   applier: innerApplier,
 *   topic: 'settings', // Used for cross-tab channel name
 * });
 * ```
 */
export function createPersistenceApplierWithDefaults<T>(
  options: PersistenceApplierOptions<T> & {
    topic?: string;
    enableCrossTab?: boolean;
  },
): DisposablePersistenceApplier<T> {
  const { topic, enableCrossTab = false, crossTabSync, ...rest } = options;

  return createPersistenceApplier({
    ...rest,
    throttling: rest.throttling ?? { debounceMs: 100, maxWaitMs: 2000 },
    crossTabSync:
      crossTabSync ??
      (enableCrossTab && topic ? { channelName: `state-sync:${topic}` } : undefined),
  });
}

/**
 * Clear persisted data from storage.
 */
export async function clearPersistedData<T>(
  storage: StorageBackend<T>,
  crossTabOptions?: CrossTabSyncOptions,
): Promise<void> {
  await storage.clear?.();

  // Notify other tabs
  if (crossTabOptions) {
    const crossTab = createCrossTabSync<T>(crossTabOptions);
    crossTab.notifyClear();
    crossTab.dispose();
  }
}
