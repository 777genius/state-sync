import type { SnapshotEnvelope } from '@statesync/core';
import type { PersistedSnapshot, StorageBackendWithMetadata, StorageUsage } from '../types';

/**
 * Configuration options for the in-memory storage backend.
 *
 * Provides fine-grained control over simulated behaviors including latency,
 * error injection, and quota limits. Designed primarily for use in unit tests
 * and integration tests where a real browser storage API is unavailable or
 * where deterministic control over storage behavior is required.
 */
export interface MemoryStorageBackendOptions {
  /**
   * An initial snapshot to pre-populate the storage with on creation.
   *
   * When provided, the storage will behave as if a save had already occurred
   * with this snapshot. Default metadata (current timestamp, schema version 1,
   * uncompressed) is generated automatically.
   */
  initialSnapshot?: SnapshotEnvelope<unknown>;

  /**
   * Simulated latency in milliseconds applied to every storage operation.
   *
   * When set to a positive value, all `save`, `load`, `clear`, `saveWithMetadata`,
   * and `loadWithMetadata` operations will be delayed by this duration before
   * executing. Useful for testing loading states, race conditions, and timeout
   * handling in consuming code.
   *
   * @default 0
   */
  latencyMs?: number;

  /**
   * When `true`, all save operations will throw an error with the configured
   * {@link errorMessage}.
   *
   * Useful for testing error handling and retry logic in persistence layers.
   *
   * @default false
   */
  failOnSave?: boolean;

  /**
   * When `true`, all load operations will throw an error with the configured
   * {@link errorMessage}.
   *
   * Useful for testing graceful degradation when stored data cannot be retrieved.
   *
   * @default false
   */
  failOnLoad?: boolean;

  /**
   * Custom error message used when {@link failOnSave} or {@link failOnLoad} is enabled.
   *
   * @default 'Simulated storage error'
   */
  errorMessage?: string;

  /**
   * Maximum allowed storage size in bytes, simulating a storage quota.
   *
   * When set, save operations will throw an error if the serialized snapshot
   * size exceeds this limit, mimicking the `QuotaExceededError` behavior
   * of browser storage APIs.
   */
  maxSizeBytes?: number;
}

/**
 * Creates an in-memory {@link StorageBackendWithMetadata} primarily intended for
 * testing purposes.
 *
 * This backend stores snapshots entirely in memory with no external dependencies
 * or browser API requirements, making it ideal for unit tests, integration tests,
 * and environments where browser storage is unavailable (e.g., Node.js, SSR).
 *
 * The returned object extends the standard {@link StorageBackendWithMetadata} interface
 * with additional testing utilities for inspecting internal state, resetting storage,
 * and dynamically toggling error injection.
 *
 * **Key features:**
 * - Zero external dependencies -- works in any JavaScript runtime
 * - Configurable latency simulation for testing async/loading behavior
 * - Error injection for testing error handling and retry logic
 * - Quota simulation for testing storage limit scenarios
 * - Full metadata support matching the IndexedDB backend contract
 * - Snapshot history tracking for assertion in tests
 *
 * @typeParam T - The type of the state data stored within snapshot envelopes.
 *
 * @param options - Configuration options for the memory backend. All options are
 *   optional; the default configuration creates a simple, zero-latency, no-failure
 *   in-memory store.
 * @returns A {@link StorageBackendWithMetadata} instance with additional testing
 *   utilities: {@link getSavedSnapshots}, {@link getRawData}, {@link reset}, and
 *   {@link setFailMode}.
 *
 * @throws {Error} Throws with the configured error message when {@link MemoryStorageBackendOptions.failOnSave | failOnSave}
 *   is enabled and a save operation is attempted.
 * @throws {Error} Throws with the configured error message when {@link MemoryStorageBackendOptions.failOnLoad | failOnLoad}
 *   is enabled and a load operation is attempted.
 * @throws {Error} Throws when the serialized snapshot exceeds
 *   {@link MemoryStorageBackendOptions.maxSizeBytes | maxSizeBytes} during a save operation.
 *
 * @example Basic usage in tests
 * ```typescript
 * const storage = createMemoryStorageBackend<MyState>();
 *
 * await storage.save({ revision: '1', data: { count: 42 } });
 * const snapshot = await storage.load();
 * expect(snapshot?.data.count).toBe(42);
 * ```
 *
 * @example With simulated latency
 * ```typescript
 * const storage = createMemoryStorageBackend<MyState>({ latencyMs: 100 });
 * // Each operation will be delayed by 100ms
 * ```
 *
 * @example Error injection for testing
 * ```typescript
 * const storage = createMemoryStorageBackend<MyState>({
 *   failOnSave: true,
 *   errorMessage: 'Disk full',
 * });
 *
 * await expect(storage.save(snapshot)).rejects.toThrow('Disk full');
 *
 * // Toggle failure mode dynamically
 * storage.setFailMode({ save: false });
 * await storage.save(snapshot); // succeeds now
 * ```
 *
 * @example Pre-populated storage with quota simulation
 * ```typescript
 * const storage = createMemoryStorageBackend<MyState>({
 *   initialSnapshot: { revision: '1', data: { count: 0 } },
 *   maxSizeBytes: 1024,
 * });
 *
 * const snapshot = await storage.load();
 * expect(snapshot).not.toBeNull();
 * ```
 */
export function createMemoryStorageBackend<T>(
  options: MemoryStorageBackendOptions = {},
): StorageBackendWithMetadata<T> & {
  /**
   * Returns a shallow copy of all snapshots that have been saved to this backend,
   * in chronological order. Useful for asserting save behavior in tests.
   *
   * @returns An array of all snapshot envelopes saved since creation or last reset.
   */
  getSavedSnapshots(): SnapshotEnvelope<T>[];

  /**
   * Returns the raw persisted data including metadata, or `null` if the
   * storage is empty. Useful for inspecting internal storage state in tests.
   *
   * @returns The current persisted snapshot with metadata, or `null`.
   */
  getRawData(): PersistedSnapshot<T> | null;

  /**
   * Resets the storage to its initial state as configured at creation time.
   *
   * Clears the snapshot history, restores the initial snapshot (if configured),
   * and resets fail modes to their original values.
   */
  reset(): void;

  /**
   * Dynamically toggles failure modes for save and/or load operations.
   *
   * This allows tests to enable or disable error injection at any point
   * during test execution without creating a new storage instance.
   *
   * @param options - An object specifying which failure modes to set.
   * @param options.save - When `true`, subsequent save operations will throw.
   *   When `false`, saves will succeed normally. Omit to leave unchanged.
   * @param options.load - When `true`, subsequent load operations will throw.
   *   When `false`, loads will succeed normally. Omit to leave unchanged.
   */
  setFailMode(options: { save?: boolean; load?: boolean }): void;
} {
  const {
    initialSnapshot,
    latencyMs = 0,
    failOnSave = false,
    failOnLoad = false,
    errorMessage = 'Simulated storage error',
    maxSizeBytes,
  } = options;

  let data: PersistedSnapshot<T> | null = initialSnapshot
    ? {
        snapshot: initialSnapshot as SnapshotEnvelope<T>,
        metadata: {
          savedAt: Date.now(),
          schemaVersion: 1,
          sizeBytes: JSON.stringify(initialSnapshot).length,
          compressed: false,
        },
      }
    : null;

  const savedSnapshots: SnapshotEnvelope<T>[] = [];
  let shouldFailOnSave = failOnSave;
  let shouldFailOnLoad = failOnLoad;

  const delay = (): Promise<void> => {
    if (latencyMs <= 0) return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, latencyMs));
  };

  return {
    async save(snapshot: SnapshotEnvelope<T>): Promise<void> {
      await delay();

      if (shouldFailOnSave) {
        throw new Error(errorMessage);
      }

      const serialized = JSON.stringify(snapshot);
      const sizeBytes = serialized.length;

      if (maxSizeBytes !== undefined && sizeBytes > maxSizeBytes) {
        throw new Error(
          `[state-sync] Memory storage quota exceeded. ` +
            `Size: ${sizeBytes} bytes, Max: ${maxSizeBytes} bytes`,
        );
      }

      savedSnapshots.push(snapshot);
      data = {
        snapshot,
        metadata: {
          savedAt: Date.now(),
          schemaVersion: 1,
          sizeBytes,
          compressed: false,
        },
      };
    },

    async load(): Promise<SnapshotEnvelope<T> | null> {
      await delay();

      if (shouldFailOnLoad) {
        throw new Error(errorMessage);
      }

      return data?.snapshot ?? null;
    },

    async clear(): Promise<void> {
      await delay();
      data = null;
    },

    async saveWithMetadata(persisted: PersistedSnapshot<T>): Promise<void> {
      await delay();

      if (shouldFailOnSave) {
        throw new Error(errorMessage);
      }

      const sizeBytes = persisted.metadata.sizeBytes;

      if (maxSizeBytes !== undefined && sizeBytes > maxSizeBytes) {
        throw new Error(
          `[state-sync] Memory storage quota exceeded. ` +
            `Size: ${sizeBytes} bytes, Max: ${maxSizeBytes} bytes`,
        );
      }

      savedSnapshots.push(persisted.snapshot);
      data = persisted;
    },

    async loadWithMetadata(): Promise<PersistedSnapshot<T> | null> {
      await delay();

      if (shouldFailOnLoad) {
        throw new Error(errorMessage);
      }

      return data;
    },

    async getUsage(): Promise<StorageUsage> {
      const used = data ? data.metadata.sizeBytes : 0;
      const quota = maxSizeBytes;

      return {
        used,
        quota,
        percentage: quota !== undefined ? Math.round((used / quota) * 100) : undefined,
      };
    },

    getSavedSnapshots(): SnapshotEnvelope<T>[] {
      return [...savedSnapshots];
    },

    getRawData(): PersistedSnapshot<T> | null {
      return data;
    },

    reset(): void {
      data = initialSnapshot
        ? {
            snapshot: initialSnapshot as SnapshotEnvelope<T>,
            metadata: {
              savedAt: Date.now(),
              schemaVersion: 1,
              sizeBytes: JSON.stringify(initialSnapshot).length,
              compressed: false,
            },
          }
        : null;
      savedSnapshots.length = 0;
      shouldFailOnSave = failOnSave;
      shouldFailOnLoad = failOnLoad;
    },

    setFailMode(opts: { save?: boolean; load?: boolean }): void {
      if (opts.save !== undefined) shouldFailOnSave = opts.save;
      if (opts.load !== undefined) shouldFailOnLoad = opts.load;
    },
  };
}

/**
 * Creates a shared in-memory storage registry that can be used to simulate
 * multiple components or persistence layers sharing a common storage medium.
 *
 * Each call to {@link getBackend} returns a {@link StorageBackendWithMetadata}
 * instance scoped to the given key, but all backends share the same underlying
 * `Map` store. This models the behavior of browser storage APIs where multiple
 * parts of an application can read/write to the same storage under different keys.
 *
 * Useful for integration tests that verify cross-component persistence behavior,
 * such as one component saving state and another loading it.
 *
 * @typeParam T - The type of the state data stored within snapshot envelopes.
 *
 * @returns An object with methods to obtain keyed storage backends and clear all data.
 *
 * @example
 * ```typescript
 * const shared = createSharedMemoryStorage<MyState>();
 *
 * const backendA = shared.getBackend('component-a');
 * const backendB = shared.getBackend('component-b');
 *
 * await backendA.save({ revision: '1', data: { count: 1 } });
 * await backendB.save({ revision: '1', data: { count: 2 } });
 *
 * // Each backend has its own isolated key
 * const snapshotA = await backendA.load();
 * const snapshotB = await backendB.load();
 *
 * // Clear all shared data at once
 * shared.clearAll();
 * ```
 */
export function createSharedMemoryStorage<T>(): {
  /**
   * Returns a {@link StorageBackendWithMetadata} instance scoped to the given key.
   *
   * Multiple calls with the same key return backends that share the same data,
   * simulating shared access to a single storage entry.
   *
   * @param key - A unique string key identifying this storage entry.
   * @returns A storage backend instance scoped to the specified key.
   */
  getBackend(key: string): StorageBackendWithMetadata<T>;

  /**
   * Clears all data across every key in the shared storage.
   *
   * Useful for cleanup in test `afterEach` or `afterAll` hooks to ensure
   * test isolation.
   */
  clearAll(): void;
} {
  const stores = new Map<string, PersistedSnapshot<T>>();

  return {
    getBackend(key: string): StorageBackendWithMetadata<T> {
      return {
        async save(snapshot: SnapshotEnvelope<T>): Promise<void> {
          stores.set(key, {
            snapshot,
            metadata: {
              savedAt: Date.now(),
              schemaVersion: 1,
              sizeBytes: JSON.stringify(snapshot).length,
              compressed: false,
            },
          });
        },

        async load(): Promise<SnapshotEnvelope<T> | null> {
          return stores.get(key)?.snapshot ?? null;
        },

        async clear(): Promise<void> {
          stores.delete(key);
        },

        async saveWithMetadata(data: PersistedSnapshot<T>): Promise<void> {
          stores.set(key, data);
        },

        async loadWithMetadata(): Promise<PersistedSnapshot<T> | null> {
          return stores.get(key) ?? null;
        },
      };
    },

    clearAll(): void {
      stores.clear();
    },
  };
}
