[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / createIndexedDBBackend

# Function: createIndexedDBBackend()

```ts
function createIndexedDBBackend<T>(options): StorageBackendWithMetadata<T>;
```

Defined in: [persistence/src/storage/indexed-db.ts:65](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/storage/indexed-db.ts#L65)

Creates a StorageBackend that uses IndexedDB.

IndexedDB is better for larger data and is fully async.
Includes automatic retry for blocked database scenarios.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`IndexedDBBackendOptions`](../interfaces/IndexedDBBackendOptions.md) |

## Returns

[`StorageBackendWithMetadata`](../interfaces/StorageBackendWithMetadata.md)\<`T`\>

## Example

```typescript
const storage = createIndexedDBBackend({
  dbName: 'my-app',
  storeName: 'state-cache',
  retryAttempts: 5,
  onBlocked: () => console.warn('Database blocked, retrying...'),
});
```
