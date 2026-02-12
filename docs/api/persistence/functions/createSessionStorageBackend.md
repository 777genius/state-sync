[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / createSessionStorageBackend

# Function: createSessionStorageBackend()

```ts
function createSessionStorageBackend<T>(options): StorageBackend<T>;
```

Defined in: [persistence/src/storage/session-storage.ts:94](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/storage/session-storage.ts#L94)

Creates a [StorageBackend](../interfaces/StorageBackend.md) that persists snapshot data using the browser's
`sessionStorage` API.

Unlike `localStorage`, data stored in `sessionStorage` is scoped to the current
browser tab and is automatically cleared when the tab or window is closed.
This makes it ideal for temporary state that should not survive across sessions,
such as form drafts, wizard progress, or transient UI state.

Each browser tab maintains its own independent `sessionStorage`, so data is
**not shared** between tabs even within the same origin.

**Browser compatibility:** Supported in all modern browsers. Requires a secure
context (HTTPS) in some browsers for full functionality. Not available in
Web Workers or Service Workers.

**Storage limits:** `sessionStorage` has a ~5MB per-origin limit in most browsers.
The storage is synchronous under the hood but exposed through an async interface
for API consistency with other backends.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The type of the state data stored within snapshot envelopes. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`SessionStorageBackendOptions`](../interfaces/SessionStorageBackendOptions.md) | Configuration options for the sessionStorage backend. |

## Returns

[`StorageBackend`](../interfaces/StorageBackend.md)\<`T`\>

A [StorageBackend](../interfaces/StorageBackend.md) instance backed by `sessionStorage`.

## Throws

Throws a descriptive error wrapping `QuotaExceededError` when
  the `sessionStorage` quota is exceeded during a save operation.

## Throws

Throws a descriptive error when stored data cannot be deserialized
  during a load operation (e.g., corrupted or incompatible data).

## Examples

```typescript
const storage = createSessionStorageBackend<MyState>({ key: 'temp-state' });

// Save a snapshot (cleared when tab closes)
await storage.save({ revision: '1', data: { step: 3 } });

// Load the snapshot
const snapshot = await storage.load();
console.log(snapshot?.data.step); // 3

// Clear stored data manually
await storage.clear();
```

```typescript
const storage = createSessionStorageBackend<MyState>({
  key: 'temp-state',
  serialize: (snapshot) => btoa(JSON.stringify(snapshot)),
  deserialize: (data) => JSON.parse(atob(data)),
});
```
