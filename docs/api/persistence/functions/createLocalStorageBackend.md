[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / createLocalStorageBackend

# Function: createLocalStorageBackend()

```ts
function createLocalStorageBackend<T>(options): StorageBackend<T>;
```

Defined in: [persistence/src/storage/local-storage.ts:35](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/storage/local-storage.ts#L35)

Creates a StorageBackend that uses browser localStorage.

Note: localStorage has a ~5MB limit and is synchronous.
For larger data, consider IndexedDB.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`LocalStorageBackendOptions`](../interfaces/LocalStorageBackendOptions.md) |

## Returns

[`StorageBackend`](../interfaces/StorageBackend.md)\<`T`\>

## Example

```typescript
const storage = createLocalStorageBackend({ key: 'my-app-state' });
```
