import type { SnapshotEnvelope } from '@statesync/core';
import type { PersistedSnapshot, StorageBackendWithMetadata, StorageUsage } from '../types';

/**
 * Configuration options for the IndexedDB storage backend.
 *
 * Allows customization of the database name, object store, versioning,
 * retry behavior, and lifecycle callbacks used when persisting snapshot data
 * to the browser's IndexedDB API.
 */
export interface IndexedDBBackendOptions {
  /**
   * The name of the IndexedDB database to open or create.
   *
   * This name is scoped to the current origin and should be unique
   * per application to avoid conflicts.
   */
  dbName: string;

  /**
   * The name of the object store within the database where snapshots are persisted.
   *
   * The object store is automatically created during the database upgrade
   * if it does not already exist.
   */
  storeName: string;

  /**
   * The key used to store and retrieve the snapshot record within the object store.
   *
   * A separate metadata record is stored under `${recordKey}:metadata`.
   *
   * @default 'snapshot'
   */
  recordKey?: string;

  /**
   * The version number of the IndexedDB database schema.
   *
   * Incrementing this value triggers the `onupgradeneeded` event, allowing
   * schema migrations. The object store specified by {@link storeName} is
   * automatically created if it does not exist during an upgrade.
   *
   * @default 1
   */
  version?: number;

  /**
   * The maximum number of retry attempts when the database connection is blocked
   * or encounters a version-related error.
   *
   * A blocked database typically occurs when another tab holds an open connection
   * to an older version of the database.
   *
   * @default 3
   */
  retryAttempts?: number;

  /**
   * The base delay in milliseconds between retry attempts.
   *
   * The actual delay uses linear backoff: `retryDelayMs * (attemptNumber + 1)`.
   *
   * @default 100
   */
  retryDelayMs?: number;

  /**
   * Callback invoked when the database open request is blocked by another connection.
   *
   * This typically happens when another tab has an open connection to an older
   * version of the database. The blocked state is handled automatically via the
   * retry mechanism, but this callback can be used for user notification or logging.
   */
  onBlocked?: () => void;

  /**
   * Callback invoked when the database requires a schema upgrade.
   *
   * Called after the default upgrade logic (object store creation) has executed.
   * Use this to perform custom schema migrations such as creating indexes.
   *
   * @param db - The `IDBDatabase` instance being upgraded.
   * @param oldVersion - The previous schema version number (0 for newly created databases).
   * @param newVersion - The new schema version number being upgraded to.
   */
  onUpgrade?: (db: IDBDatabase, oldVersion: number, newVersion: number) => void;
}

/**
 * Creates a {@link StorageBackendWithMetadata} that persists snapshot data using
 * the browser's IndexedDB API.
 *
 * IndexedDB is a fully asynchronous, transactional key-value store with significantly
 * higher storage limits than `localStorage` or `sessionStorage` (typically hundreds of MB
 * or more, depending on browser and available disk space). This makes it the recommended
 * backend for applications that persist large state objects.
 *
 * The returned backend supports the extended {@link StorageBackendWithMetadata} interface,
 * providing metadata-aware save/load operations and storage usage estimation via the
 * Storage Manager API when available.
 *
 * **Key features:**
 * - Fully asynchronous, non-blocking I/O
 * - Automatic retry with linear backoff for blocked database scenarios
 * - Lazy connection management (database is opened on first operation)
 * - Connection caching to avoid repeated open requests
 * - Separate storage of snapshot and metadata for atomic access
 * - Backwards-compatible loading (generates default metadata if missing)
 *
 * **Browser compatibility:** Supported in all modern browsers including Web Workers
 * and Service Workers. Not available in some privacy-focused browser configurations
 * (e.g., Firefox private browsing prior to version 115).
 *
 * @typeParam T - The type of the state data stored within snapshot envelopes.
 *
 * @param options - Configuration options for the IndexedDB backend.
 * @returns A {@link StorageBackendWithMetadata} instance backed by IndexedDB.
 *
 * @throws {Error} Throws when the database cannot be opened after all retry attempts
 *   are exhausted (e.g., persistent version conflicts or blocked connections).
 * @throws {DOMException} Propagates IndexedDB transaction errors (e.g., `DataError`,
 *   `ReadOnlyError`) if they are not retryable.
 *
 * @example Basic usage
 * ```typescript
 * const storage = createIndexedDBBackend<MyState>({
 *   dbName: 'my-app',
 *   storeName: 'state-cache',
 * });
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
 * @example With metadata and retry configuration
 * ```typescript
 * const storage = createIndexedDBBackend<MyState>({
 *   dbName: 'my-app',
 *   storeName: 'state-cache',
 *   retryAttempts: 5,
 *   retryDelayMs: 200,
 *   onBlocked: () => console.warn('Database blocked by another tab'),
 *   onUpgrade: (db, oldVersion, newVersion) => {
 *     console.log(`Upgrading DB from v${oldVersion} to v${newVersion}`);
 *   },
 * });
 *
 * // Save with metadata
 * await storage.saveWithMetadata({
 *   snapshot: { revision: '1', data: { count: 42 } },
 *   metadata: { savedAt: Date.now(), schemaVersion: 1, sizeBytes: 128, compressed: false },
 * });
 *
 * // Load with metadata
 * const persisted = await storage.loadWithMetadata();
 * console.log(persisted?.metadata.savedAt);
 *
 * // Check storage usage
 * const usage = await storage.getUsage();
 * console.log(`Using ${usage.percentage}% of quota`);
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
