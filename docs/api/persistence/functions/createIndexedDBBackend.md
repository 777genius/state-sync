[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / createIndexedDBBackend

# Function: createIndexedDBBackend()

```ts
function createIndexedDBBackend<T>(options): StorageBackendWithMetadata<T>;
```

Defined in: [persistence/src/storage/indexed-db.ts:171](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/storage/indexed-db.ts#L171)

Creates a [StorageBackendWithMetadata](../interfaces/StorageBackendWithMetadata.md) that persists snapshot data using
the browser's IndexedDB API.

IndexedDB is a fully asynchronous, transactional key-value store with significantly
higher storage limits than `localStorage` or `sessionStorage` (typically hundreds of MB
or more, depending on browser and available disk space). This makes it the recommended
backend for applications that persist large state objects.

The returned backend supports the extended [StorageBackendWithMetadata](../interfaces/StorageBackendWithMetadata.md) interface,
providing metadata-aware save/load operations and storage usage estimation via the
Storage Manager API when available.

**Key features:**
- Fully asynchronous, non-blocking I/O
- Automatic retry with linear backoff for blocked database scenarios
- Lazy connection management (database is opened on first operation)
- Connection caching to avoid repeated open requests
- Separate storage of snapshot and metadata for atomic access
- Backwards-compatible loading (generates default metadata if missing)

**Browser compatibility:** Supported in all modern browsers including Web Workers
and Service Workers. Not available in some privacy-focused browser configurations
(e.g., Firefox private browsing prior to version 115).

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The type of the state data stored within snapshot envelopes. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`IndexedDBBackendOptions`](../interfaces/IndexedDBBackendOptions.md) | Configuration options for the IndexedDB backend. |

## Returns

[`StorageBackendWithMetadata`](../interfaces/StorageBackendWithMetadata.md)\<`T`\>

A [StorageBackendWithMetadata](../interfaces/StorageBackendWithMetadata.md) instance backed by IndexedDB.

## Throws

Throws when the database cannot be opened after all retry attempts
  are exhausted (e.g., persistent version conflicts or blocked connections).

## Throws

Propagates IndexedDB transaction errors (e.g., `DataError`,
  `ReadOnlyError`) if they are not retryable.

## Examples

```typescript
const storage = createIndexedDBBackend<MyState>({
  dbName: 'my-app',
  storeName: 'state-cache',
});

// Save a snapshot
await storage.save({ revision: '1', data: { count: 42 } });

// Load the snapshot
const snapshot = await storage.load();
console.log(snapshot?.data.count); // 42

// Clear stored data
await storage.clear();
```

```typescript
const storage = createIndexedDBBackend<MyState>({
  dbName: 'my-app',
  storeName: 'state-cache',
  retryAttempts: 5,
  retryDelayMs: 200,
  onBlocked: () => console.warn('Database blocked by another tab'),
  onUpgrade: (db, oldVersion, newVersion) => {
    console.log(`Upgrading DB from v${oldVersion} to v${newVersion}`);
  },
});

// Save with metadata
await storage.saveWithMetadata({
  snapshot: { revision: '1', data: { count: 42 } },
  metadata: { savedAt: Date.now(), schemaVersion: 1, sizeBytes: 128, compressed: false },
});

// Load with metadata
const persisted = await storage.loadWithMetadata();
console.log(persisted?.metadata.savedAt);

// Check storage usage
const usage = await storage.getUsage();
console.log(`Using ${usage.percentage}% of quota`);
```
