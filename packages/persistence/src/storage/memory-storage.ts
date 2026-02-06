import type { SnapshotEnvelope } from '@statesync/core';
import type { PersistedSnapshot, StorageBackendWithMetadata, StorageUsage } from '../types';

/**
 * Options for in-memory storage backend.
 */
export interface MemoryStorageBackendOptions {
  /**
   * Initial snapshot to pre-populate storage.
   */
  initialSnapshot?: SnapshotEnvelope<unknown>;

  /**
   * Simulated latency in ms (for testing async behavior).
   */
  latencyMs?: number;

  /**
   * If true, throws an error on save (for testing error handling).
   */
  failOnSave?: boolean;

  /**
   * If true, throws an error on load (for testing error handling).
   */
  failOnLoad?: boolean;

  /**
   * Custom error message for failures.
   */
  errorMessage?: string;

  /**
   * Maximum storage size in bytes (simulates quota).
   */
  maxSizeBytes?: number;
}

/**
 * Creates an in-memory StorageBackend for testing.
 *
 * Features:
 * - No external dependencies
 * - Configurable latency simulation
 * - Error injection for testing
 * - Quota simulation
 * - Full metadata support
 *
 * @example
 * ```typescript
 * // Basic usage
 * const storage = createMemoryStorageBackend();
 *
 * // With simulated latency
 * const slowStorage = createMemoryStorageBackend({ latencyMs: 100 });
 *
 * // With error injection
 * const failingStorage = createMemoryStorageBackend({ failOnSave: true });
 *
 * // Pre-populated
 * const preloadedStorage = createMemoryStorageBackend({
 *   initialSnapshot: { revision: '1', data: { count: 0 } },
 * });
 * ```
 */
export function createMemoryStorageBackend<T>(
  options: MemoryStorageBackendOptions = {},
): StorageBackendWithMetadata<T> & {
  /**
   * Get all saved snapshots (for testing assertions).
   */
  getSavedSnapshots(): SnapshotEnvelope<T>[];

  /**
   * Get raw storage data (for testing).
   */
  getRawData(): PersistedSnapshot<T> | null;

  /**
   * Reset storage to initial state.
   */
  reset(): void;

  /**
   * Set fail modes dynamically (for testing).
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
 * Creates a shared memory storage that can be used across multiple tests.
 * Useful for simulating shared storage between components.
 */
export function createSharedMemoryStorage<T>(): {
  getBackend(key: string): StorageBackendWithMetadata<T>;
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
