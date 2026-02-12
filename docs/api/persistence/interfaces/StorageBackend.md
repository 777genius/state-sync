[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / StorageBackend

# Interface: StorageBackend\<T\>

Defined in: [persistence/src/types.ts:167](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L167)

Abstract storage backend for persisting snapshots.

Implementations must handle serialization/deserialization internally.
The save/load methods work with SnapshotEnvelope to preserve
revision metadata alongside the application state.

Built-in implementations include localStorage, sessionStorage, IndexedDB,
and an in-memory backend for testing.

## Example

```typescript
const storage: StorageBackend<MyState> = createLocalStorageBackend({
  key: 'my-app-state',
});
```

## Extended by

- [`StorageBackendWithMetadata`](StorageBackendWithMetadata.md)

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The shape of the application state. |

## Methods

### clear()?

```ts
optional clear(): Promise<void>;
```

Defined in: [persistence/src/types.ts:190](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L190)

Remove all persisted data from this backend's storage key.

This method is optional -- not all backends support clearing.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the data has been removed.

***

### load()

```ts
load(): Promise<SnapshotEnvelope<T> | null>;
```

Defined in: [persistence/src/types.ts:181](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L181)

Load the most recent snapshot from persistent storage.

#### Returns

`Promise`\<`SnapshotEnvelope`\<`T`\> \| `null`\>

The stored snapshot, or `null` if no snapshot has been persisted yet.

***

### save()

```ts
save(snapshot): Promise<void>;
```

Defined in: [persistence/src/types.ts:174](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L174)

Save a snapshot to persistent storage.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `snapshot` | `SnapshotEnvelope`\<`T`\> | The snapshot envelope to persist. |

#### Returns

`Promise`\<`void`\>

A promise that resolves when the write is complete.
