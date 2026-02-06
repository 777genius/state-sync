import type { SnapshotEnvelope } from '@statesync/core';
import type { StorageBackend } from '../types';

/**
 * Options for localStorage backend.
 */
export interface LocalStorageBackendOptions {
  /**
   * The key to use in localStorage.
   */
  key: string;

  /**
   * Optional custom serializer. Defaults to JSON.stringify.
   */
  serialize?: (snapshot: SnapshotEnvelope<unknown>) => string;

  /**
   * Optional custom deserializer. Defaults to JSON.parse.
   */
  deserialize?: (data: string) => SnapshotEnvelope<unknown>;
}

/**
 * Creates a StorageBackend that uses browser localStorage.
 *
 * Note: localStorage has a ~5MB limit and is synchronous.
 * For larger data, consider IndexedDB.
 *
 * @example
 * ```typescript
 * const storage = createLocalStorageBackend({ key: 'my-app-state' });
 * ```
 */
export function createLocalStorageBackend<T>(
  options: LocalStorageBackendOptions,
): StorageBackend<T> {
  const { key, serialize = JSON.stringify, deserialize = JSON.parse } = options;

  return {
    async save(snapshot: SnapshotEnvelope<T>): Promise<void> {
      const data = serialize(snapshot);
      try {
        localStorage.setItem(key, data);
      } catch (error) {
        // Handle QuotaExceededError with a more informative message
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          throw new Error(
            `[state-sync] localStorage quota exceeded for key "${key}". ` +
              `Data size: ${Math.round(data.length / 1024)}KB. ` +
              `Consider using IndexedDB for larger data.`,
          );
        }
        throw error;
      }
    },

    async load(): Promise<SnapshotEnvelope<T> | null> {
      const data = localStorage.getItem(key);
      if (data === null) {
        return null;
      }
      try {
        return deserialize(data) as SnapshotEnvelope<T>;
      } catch (error) {
        // Handle corrupted data gracefully
        throw new Error(
          `[state-sync] Failed to deserialize data from localStorage key "${key}". ` +
            `The cached data may be corrupted. Original error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },

    async clear(): Promise<void> {
      localStorage.removeItem(key);
    },
  };
}
