[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / withCrossTabSync

# Function: withCrossTabSync()

```ts
function withCrossTabSync<T>(storage, options): object;
```

Defined in: [persistence/src/cross-tab.ts:335](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/cross-tab.ts#L335)

Wraps a storage backend's `save` method to automatically broadcast
snapshots to other tabs after each successful save.

This is a lower-level utility for cases where you want cross-tab sync
without using the full [createPersistenceApplier](createPersistenceApplier.md). The returned
object exposes both the wrapped `save` function and the underlying
[CrossTabSync](../interfaces/CrossTabSync.md) instance for manual control.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The shape of the application state. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `storage` | \{ `save`: `Promise`\<`void`\>; \} | Any object with a `save` method (typically a [StorageBackend](../interfaces/StorageBackend.md)). |
| `storage.save` | - |
| `options` | [`CrossTabSyncHandlers`](../interfaces/CrossTabSyncHandlers.md)\<`T`\> | Cross-tab sync configuration and event handlers. |

## Returns

`object`

An object with a `save` method (broadcasts after writing) and
  a `crossTab` property for direct access to the sync manager.

### crossTab

```ts
crossTab: CrossTabSync<T>;
```

### save()

```ts
save(snapshot): Promise<void>;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `snapshot` | `SnapshotEnvelope`\<`T`\> |

#### Returns

`Promise`\<`void`\>

## Example

```typescript
const { save, crossTab } = withCrossTabSync(
  createLocalStorageBackend({ key: 'my-state' }),
  {
    channelName: 'my-app-state',
    onSnapshot: (snapshot) => applier.apply(snapshot),
  },
);

await save(snapshot); // Saves to storage AND broadcasts to other tabs
crossTab.dispose();   // Cleanup when done
```
