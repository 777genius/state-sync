[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / clearPersistedData

# Function: clearPersistedData()

```ts
function clearPersistedData<T>(storage, crossTabOptions?): Promise<void>;
```

Defined in: [persistence/src/persistence-applier.ts:635](https://github.com/777genius/state-sync/blob/6c6e0d479cf192c3cfd1c8f1bfbceaf70a62ee5d/packages/persistence/src/persistence-applier.ts#L635)

Clear persisted data from storage.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `storage` | [`StorageBackend`](../interfaces/StorageBackend.md)\<`T`\> |
| `crossTabOptions?` | [`CrossTabSyncOptions`](../interfaces/CrossTabSyncOptions.md) |

## Returns

`Promise`\<`void`\>
