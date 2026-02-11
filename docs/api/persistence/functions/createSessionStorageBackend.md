[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / createSessionStorageBackend

# Function: createSessionStorageBackend()

```ts
function createSessionStorageBackend<T>(options): StorageBackend<T>;
```

Defined in: [persistence/src/storage/session-storage.ts:37](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/persistence/src/storage/session-storage.ts#L37)

Creates a StorageBackend that uses browser sessionStorage.

sessionStorage data is cleared when the tab/window is closed.
Useful for temporary state that shouldn't persist across sessions.

Note: sessionStorage has a ~5MB limit and is synchronous.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`SessionStorageBackendOptions`](../interfaces/SessionStorageBackendOptions.md) |

## Returns

[`StorageBackend`](../interfaces/StorageBackend.md)\<`T`\>

## Example

```typescript
const storage = createSessionStorageBackend({ key: 'temp-state' });
```
