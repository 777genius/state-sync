import type { SnapshotEnvelope } from '@statesync/core';
import type { StorageBackend } from '../types';

/**
 * Options for sessionStorage backend.
 */
export interface SessionStorageBackendOptions {
  /**
   * The key to use in sessionStorage.
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
 * Creates a StorageBackend that uses browser sessionStorage.
 *
 * sessionStorage data is cleared when the tab/window is closed.
 * Useful for temporary state that shouldn't persist across sessions.
 *
 * Note: sessionStorage has a ~5MB limit and is synchronous.
 *
 * @example
 * ```typescript
 * const storage = createSessionStorageBackend({ key: 'temp-state' });
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
