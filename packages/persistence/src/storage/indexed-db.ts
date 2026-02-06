import type { SnapshotEnvelope } from '@statesync/core';
import type { PersistedSnapshot, StorageBackendWithMetadata, StorageUsage } from '../types';

/**
 * Options for IndexedDB backend.
 */
export interface IndexedDBBackendOptions {
  /**
   * Database name.
   */
  dbName: string;

  /**
   * Object store name.
   */
  storeName: string;

  /**
   * Optional key for the snapshot record. Defaults to 'snapshot'.
   */
  recordKey?: string;

  /**
   * Optional database version. Defaults to 1.
   */
  version?: number;

  /**
   * Number of retry attempts for blocked database. Defaults to 3.
   */
  retryAttempts?: number;

  /**
   * Delay between retries in ms. Defaults to 100.
   */
  retryDelayMs?: number;

  /**
   * Called when database is blocked by another connection.
   */
  onBlocked?: () => void;

  /**
   * Called when database upgrade is needed.
   */
  onUpgrade?: (db: IDBDatabase, oldVersion: number, newVersion: number) => void;
}

/**
 * Creates a StorageBackend that uses IndexedDB.
 *
 * IndexedDB is better for larger data and is fully async.
 * Includes automatic retry for blocked database scenarios.
 *
 * @example
 * ```typescript
 * const storage = createIndexedDBBackend({
 *   dbName: 'my-app',
 *   storeName: 'state-cache',
 *   retryAttempts: 5,
 *   onBlocked: () => console.warn('Database blocked, retrying...'),
 * });
 * ```
 */
export function createIndexedDBBackend<T>(
  options: IndexedDBBackendOptions,
): StorageBackendWithMetadata<T> {
  const {
    dbName,
    storeName,
    recordKey = 'snapshot',
    version = 1,
    retryAttempts = 3,
    retryDelayMs = 100,
    onBlocked,
    onUpgrade,
  } = options;

  let dbPromise: Promise<IDBDatabase> | null = null;

  const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

  const openDB = async (): Promise<IDBDatabase> => {
    if (dbPromise) {
      return dbPromise;
    }

    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(dbName, version);

      request.onerror = () => {
        dbPromise = null;
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = request.result;
        const oldVersion = event.oldVersion;

        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }

        onUpgrade?.(db, oldVersion, version);
      };

      request.onblocked = () => {
        onBlocked?.();
        // Will retry via the retry mechanism
      };
    });

    return dbPromise;
  };

  const withRetry = async <R>(operation: () => Promise<R>): Promise<R> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if it's a blocked/versioning error that might be retryable
        const isRetryable =
          lastError.name === 'VersionError' ||
          lastError.message.includes('blocked') ||
          lastError.message.includes('version');

        if (!isRetryable || attempt === retryAttempts) {
          throw lastError;
        }

        // Reset connection and retry
        dbPromise = null;
        await delay(retryDelayMs * (attempt + 1));
      }
    }

    throw lastError ?? new Error('Unknown IndexedDB error');
  };

  const metadataKey = `${recordKey}:metadata`;

  return {
    async save(snapshot: SnapshotEnvelope<T>): Promise<void> {
      return withRetry(async () => {
        const db = await openDB();

        return new Promise<void>((resolve, reject) => {
          const tx = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          const request = store.put(snapshot, recordKey);

          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve();
        });
      });
    },

    async load(): Promise<SnapshotEnvelope<T> | null> {
      return withRetry(async () => {
        const db = await openDB();

        return new Promise<SnapshotEnvelope<T> | null>((resolve, reject) => {
          const tx = db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          const request = store.get(recordKey);

          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            resolve((request.result as SnapshotEnvelope<T>) ?? null);
          };
        });
      });
    },

    async clear(): Promise<void> {
      return withRetry(async () => {
        const db = await openDB();

        return new Promise<void>((resolve, reject) => {
          const tx = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);

          // Delete both snapshot and metadata
          const request1 = store.delete(recordKey);
          const request2 = store.delete(metadataKey);

          let completed = 0;
          const checkComplete = () => {
            completed++;
            if (completed === 2) resolve();
          };

          request1.onerror = () => reject(request1.error);
          request1.onsuccess = checkComplete;
          request2.onerror = () => reject(request2.error);
          request2.onsuccess = checkComplete;
        });
      });
    },

    async saveWithMetadata(data: PersistedSnapshot<T>): Promise<void> {
      return withRetry(async () => {
        const db = await openDB();

        return new Promise<void>((resolve, reject) => {
          const tx = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);

          // Store snapshot and metadata separately for atomic access
          const request1 = store.put(data.snapshot, recordKey);
          const request2 = store.put(data.metadata, metadataKey);

          let completed = 0;
          let hasError = false;

          const checkComplete = () => {
            completed++;
            if (completed === 2 && !hasError) resolve();
          };

          const handleError = (error: DOMException | null) => {
            if (!hasError) {
              hasError = true;
              reject(error);
            }
          };

          request1.onerror = () => handleError(request1.error);
          request1.onsuccess = checkComplete;
          request2.onerror = () => handleError(request2.error);
          request2.onsuccess = checkComplete;
        });
      });
    },

    async loadWithMetadata(): Promise<PersistedSnapshot<T> | null> {
      return withRetry(async () => {
        const db = await openDB();

        return new Promise<PersistedSnapshot<T> | null>((resolve, reject) => {
          const tx = db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);

          const request1 = store.get(recordKey);
          const request2 = store.get(metadataKey);

          let snapshot: SnapshotEnvelope<T> | null = null;
          let metadata: PersistedSnapshot<T>['metadata'] | null = null;
          let completed = 0;
          let hasError = false;

          const checkComplete = () => {
            completed++;
            if (completed === 2 && !hasError) {
              if (snapshot && metadata) {
                resolve({ snapshot, metadata });
              } else if (snapshot) {
                // Backwards compatibility: return with default metadata
                resolve({
                  snapshot,
                  metadata: {
                    savedAt: Date.now(),
                    schemaVersion: 1,
                    sizeBytes: JSON.stringify(snapshot).length,
                    compressed: false,
                  },
                });
              } else {
                resolve(null);
              }
            }
          };

          const handleError = (error: DOMException | null) => {
            if (!hasError) {
              hasError = true;
              reject(error);
            }
          };

          request1.onerror = () => handleError(request1.error);
          request1.onsuccess = () => {
            snapshot = request1.result ?? null;
            checkComplete();
          };
          request2.onerror = () => handleError(request2.error);
          request2.onsuccess = () => {
            metadata = request2.result ?? null;
            checkComplete();
          };
        });
      });
    },

    async getUsage(): Promise<StorageUsage> {
      // Try to use Storage API if available
      if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
        try {
          const estimate = await navigator.storage.estimate();
          return {
            used: estimate.usage ?? 0,
            quota: estimate.quota,
            percentage:
              estimate.quota && estimate.usage
                ? Math.round((estimate.usage / estimate.quota) * 100)
                : undefined,
          };
        } catch {
          // Fall through to default
        }
      }

      // Fallback: estimate based on stored data
      const data = await this.loadWithMetadata();
      return {
        used: data?.metadata.sizeBytes ?? 0,
      };
    },
  };
}
