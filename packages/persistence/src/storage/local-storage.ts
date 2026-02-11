import type { SnapshotEnvelope } from '@statesync/core';
import type { StorageBackend } from '../types';

/**
 * Configuration options for the localStorage storage backend.
 *
 * Allows customization of the storage key and serialization behavior
 * used when persisting snapshot data to the browser's `localStorage` API.
 */
export interface LocalStorageBackendOptions {
  /**
   * The key under which snapshot data is stored in `localStorage`.
   *
   * Must be unique per application or state instance to avoid collisions
   * with other data stored in the same origin's `localStorage`.
   */
  key: string;

  /**
   * Custom serialization function for converting a snapshot envelope into a string
   * suitable for `localStorage` storage.
   *
   * @param snapshot - The snapshot envelope to serialize.
   * @returns A string representation of the snapshot.
   * @default JSON.stringify
   */
  serialize?: (snapshot: SnapshotEnvelope<unknown>) => string;

  /**
   * Custom deserialization function for converting a stored string back into
   * a snapshot envelope.
   *
   * @param data - The raw string retrieved from `localStorage`.
   * @returns The deserialized snapshot envelope.
   * @default JSON.parse
   */
  deserialize?: (data: string) => SnapshotEnvelope<unknown>;
}

/**
 * Creates a {@link StorageBackend} that persists snapshot data using the browser's
 * `localStorage` API.
 *
 * Data stored in `localStorage` persists across browser sessions and tab closures,
 * making it suitable for long-lived application state. The storage is synchronous
 * under the hood but exposed through an async interface for API consistency.
 *
 * **Browser compatibility:** Supported in all modern browsers. Requires a secure
 * context (HTTPS) in some browsers for full functionality. Not available in
 * Web Workers or Service Workers.
 *
 * **Storage limits:** `localStorage` has a ~5MB per-origin limit in most browsers.
 * For larger data, consider using {@link createIndexedDBBackend} instead.
 *
 * @typeParam T - The type of the state data stored within snapshot envelopes.
 *
 * @param options - Configuration options for the localStorage backend.
 * @returns A {@link StorageBackend} instance backed by `localStorage`.
 *
 * @throws {Error} Throws a descriptive error wrapping `QuotaExceededError` when
 *   the `localStorage` quota is exceeded during a save operation.
 * @throws {Error} Throws a descriptive error when stored data cannot be deserialized
 *   during a load operation (e.g., corrupted or incompatible data).
 *
 * @example Basic usage
 * ```typescript
 * const storage = createLocalStorageBackend<MyState>({ key: 'my-app-state' });
 *
 * // Save a snapshot
 * await storage.save({ revision: '1', data: { count: 42 } });
 *
 * // Load the snapshot
 * const snapshot = await storage.load();
 * console.log(snapshot?.data.count); // 42
 *
 * // Clear stored data
 * await storage.clear();
 * ```
 *
 * @example With custom serialization
 * ```typescript
 * const storage = createLocalStorageBackend<MyState>({
 *   key: 'my-app-state',
 *   serialize: (snapshot) => btoa(JSON.stringify(snapshot)),
 *   deserialize: (data) => JSON.parse(atob(data)),
 * });
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
