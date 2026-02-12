[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / clearPersistedData

# Function: clearPersistedData()

```ts
function clearPersistedData<T>(storage, crossTabOptions?): Promise<void>;
```

Defined in: [persistence/src/persistence-applier.ts:699](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/persistence-applier.ts#L699)

Clears all persisted data from the given storage backend and optionally
notifies other tabs via BroadcastChannel.

If the storage backend does not implement `clear()`, this is a no-op for
the storage part. Cross-tab notification is still sent if options are provided.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The shape of the application state. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `storage` | [`StorageBackend`](../interfaces/StorageBackend.md)\<`T`\> | The storage backend to clear. |
| `crossTabOptions?` | [`CrossTabSyncOptions`](../interfaces/CrossTabSyncOptions.md) | If provided, a temporary BroadcastChannel is opened to notify other tabs that storage was cleared, then immediately disposed. |

## Returns

`Promise`\<`void`\>

A promise that resolves when the storage has been cleared.

## Example

```typescript
await clearPersistedData(storage, { channelName: 'state-sync:settings' });
```
