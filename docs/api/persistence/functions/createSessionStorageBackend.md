[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / createSessionStorageBackend

# Function: createSessionStorageBackend()

```ts
function createSessionStorageBackend<T>(options): StorageBackend<T>;
```

Defined in: [persistence/src/storage/session-storage.ts:37](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/storage/session-storage.ts#L37)

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
