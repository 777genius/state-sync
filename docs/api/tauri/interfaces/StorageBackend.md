[**@statesync/tauri**](../index.md)

***

[@statesync/tauri](../index.md) / StorageBackend

# Interface: StorageBackend\<T\>

Defined in: [persistence.ts:23](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/tauri/src/persistence.ts#L23)

Abstract storage backend interface for persisting snapshot envelopes.

This interface mirrors the contract from `@statesync/persistence` and is
re-declared here so that `@statesync/tauri` does not require
`@statesync/persistence` as a runtime dependency.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The application-specific snapshot data type. |

## Methods

### clear()?

```ts
optional clear(): Promise<void>;
```

Defined in: [persistence.ts:46](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/tauri/src/persistence.ts#L46)

Remove any persisted snapshot from the backing store.

Implementations may omit this method if clearing is not supported.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the data has been removed.

***

### load()

```ts
load(): Promise<SnapshotEnvelope<T> | null>;
```

Defined in: [persistence.ts:37](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/tauri/src/persistence.ts#L37)

Load the most recently saved snapshot envelope from the backing store.

#### Returns

`Promise`\<`SnapshotEnvelope`\<`T`\> \| `null`\>

The stored snapshot, or `null` if no snapshot has been saved yet.

***

### save()

```ts
save(snapshot): Promise<void>;
```

Defined in: [persistence.ts:30](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/tauri/src/persistence.ts#L30)

Persist a snapshot envelope to the backing store.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `snapshot` | `SnapshotEnvelope`\<`T`\> | The versioned snapshot to save. |

#### Returns

`Promise`\<`void`\>

A promise that resolves when the write is complete.
