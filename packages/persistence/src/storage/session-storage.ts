import type { SnapshotEnvelope } from '@statesync/core';
import type { StorageBackend } from '../types';

/**
 * Configuration options for the sessionStorage storage backend.
 *
 * Allows customization of the storage key and serialization behavior
 * used when persisting snapshot data to the browser's `sessionStorage` API.
 */
export interface SessionStorageBackendOptions {
  /**
   * The key under which snapshot data is stored in `sessionStorage`.
   *
   * Must be unique per application or state instance to avoid collisions
   * with other data stored in the same origin's `sessionStorage`.
   */
  key: string;

  /**
   * Custom serialization function for converting a snapshot envelope into a string
   * suitable for `sessionStorage` storage.
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
   * @param data - The raw string retrieved from `sessionStorage`.
   * @returns The deserialized snapshot envelope.
   * @default JSON.parse
   */
  deserialize?: (data: string) => SnapshotEnvelope<unknown>;
}

/**
 * Creates a {@link StorageBackend} that persists snapshot data using the browser's
 * `sessionStorage` API.
 *
 * Unlike `localStorage`, data stored in `sessionStorage` is scoped to the current
 * browser tab and is automatically cleared when the tab or window is closed.
 * This makes it ideal for temporary state that should not survive across sessions,
 * such as form drafts, wizard progress, or transient UI state.
 *
 * Each browser tab maintains its own independent `sessionStorage`, so data is
 * **not shared** between tabs even within the same origin.
 *
 * **Browser compatibility:** Supported in all modern browsers. Requires a secure
 * context (HTTPS) in some browsers for full functionality. Not available in
 * Web Workers or Service Workers.
 *
 * **Storage limits:** `sessionStorage` has a ~5MB per-origin limit in most browsers.
 * The storage is synchronous under the hood but exposed through an async interface
 * for API consistency with other backends.
 *
 * @typeParam T - The type of the state data stored within snapshot envelopes.
 *
 * @param options - Configuration options for the sessionStorage backend.
 * @returns A {@link StorageBackend} instance backed by `sessionStorage`.
 *
 * @throws {Error} Throws a descriptive error wrapping `QuotaExceededError` when
 *   the `sessionStorage` quota is exceeded during a save operation.
 * @throws {Error} Throws a descriptive error when stored data cannot be deserialized
 *   during a load operation (e.g., corrupted or incompatible data).
 *
 * @example Basic usage
 * ```typescript
 * const storage = createSessionStorageBackend<MyState>({ key: 'temp-state' });
 *
 * // Save a snapshot (cleared when tab closes)
 * await storage.save({ revision: '1', data: { step: 3 } });
 *
 * // Load the snapshot
 * const snapshot = await storage.load();
 * console.log(snapshot?.data.step); // 3
 *
 * // Clear stored data manually
 * await storage.clear();
 * ```
 *
 * @example With custom serialization
 * ```typescript
 * const storage = createSessionStorageBackend<MyState>({
 *   key: 'temp-state',
 *   serialize: (snapshot) => btoa(JSON.stringify(snapshot)),
 *   deserialize: (data) => JSON.parse(atob(data)),
 * });
 * ```
 */
export function createSessionStorageBackend<T>(
  options: SessionStorageBackendOptions,
): StorageBackend<T> {
  const { key, serialize = JSON.stringify, deserialize = JSON.parse } = options;

  return {
    async save(snapshot: SnapshotEnvelope<T>): Promise<void> {
      const data = serialize(snapshot);
      try {
        sessionStorage.setItem(key, data);
      } catch (error) {
        if (
          error instanceof DOMException &&
          (error.name === 'QuotaExceededError' || error.code === 22)
        ) {
          throw new Error(
            `[state-sync] sessionStorage quota exceeded for key "${key}". ` +
              `Data size: ${Math.round(data.length / 1024)}KB.`,
          );
        }
        throw error;
      }
    },

    async load(): Promise<SnapshotEnvelope<T> | null> {
      const data = sessionStorage.getItem(key);
      if (data === null) {
        return null;
      }
      try {
        return deserialize(data) as SnapshotEnvelope<T>;
      } catch (error) {
        throw new Error(
          `[state-sync] Failed to deserialize data from sessionStorage key "${key}". ` +
            `The cached data may be corrupted. Original error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },

    async clear(): Promise<void> {
      sessionStorage.removeItem(key);
    },
  };
}
