[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / withCrossTabSync

# Function: withCrossTabSync()

```ts
function withCrossTabSync<T>(storage, options): object;
```

Defined in: [persistence/src/cross-tab.ts:238](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/persistence/src/cross-tab.ts#L238)

Wrapper to add cross-tab sync to a storage backend.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `storage` | \{ `save`: `Promise`\<`void`\>; \} |
| `storage.save` |
| `options` | [`CrossTabSyncHandlers`](../interfaces/CrossTabSyncHandlers.md)\<`T`\> |

## Returns

`object`

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
const storage = withCrossTabSync(
  createLocalStorageBackend({ key: 'my-state' }),
  {
    channelName: 'my-app-state',
    onSnapshot: (snapshot) => applier.apply(snapshot),
  },
);
```
