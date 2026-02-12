[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / createLocalStorageBackend

# Function: createLocalStorageBackend()

```ts
function createLocalStorageBackend<T>(options): StorageBackend<T>;
```

Defined in: [persistence/src/storage/local-storage.ts:89](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/storage/local-storage.ts#L89)

Creates a [StorageBackend](../interfaces/StorageBackend.md) that persists snapshot data using the browser's
`localStorage` API.

Data stored in `localStorage` persists across browser sessions and tab closures,
making it suitable for long-lived application state. The storage is synchronous
under the hood but exposed through an async interface for API consistency.

**Browser compatibility:** Supported in all modern browsers. Requires a secure
context (HTTPS) in some browsers for full functionality. Not available in
Web Workers or Service Workers.

**Storage limits:** `localStorage` has a ~5MB per-origin limit in most browsers.
For larger data, consider using [createIndexedDBBackend](createIndexedDBBackend.md) instead.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The type of the state data stored within snapshot envelopes. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`LocalStorageBackendOptions`](../interfaces/LocalStorageBackendOptions.md) | Configuration options for the localStorage backend. |

## Returns

[`StorageBackend`](../interfaces/StorageBackend.md)\<`T`\>

A [StorageBackend](../interfaces/StorageBackend.md) instance backed by `localStorage`.

## Throws

Throws a descriptive error wrapping `QuotaExceededError` when
  the `localStorage` quota is exceeded during a save operation.

## Throws

Throws a descriptive error when stored data cannot be deserialized
  during a load operation (e.g., corrupted or incompatible data).

## Examples

```typescript
const storage = createLocalStorageBackend<MyState>({ key: 'my-app-state' });

// Save a snapshot
await storage.save({ revision: '1', data: { count: 42 } });

// Load the snapshot
const snapshot = await storage.load();
console.log(snapshot?.data.count); // 42

// Clear stored data
await storage.clear();
```

```typescript
const storage = createLocalStorageBackend<MyState>({
  key: 'my-app-state',
  serialize: (snapshot) => btoa(JSON.stringify(snapshot)),
  deserialize: (data) => JSON.parse(atob(data)),
});
```
