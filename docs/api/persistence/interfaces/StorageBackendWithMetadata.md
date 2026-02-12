[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / StorageBackendWithMetadata

# Interface: StorageBackendWithMetadata\<T\>

Defined in: [persistence/src/types.ts:204](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L204)

Extended storage backend that persists metadata alongside snapshots.

Backends implementing this interface support schema versioning, TTL expiration,
integrity hashing, and storage usage reporting.

The persistence applier automatically detects this interface via duck typing
and uses the metadata-aware methods when available.

## Extends

- [`StorageBackend`](StorageBackend.md)\<`T`\>

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

#### Inherited from

[`StorageBackend`](StorageBackend.md).[`clear`](StorageBackend.md#clear)

***

### getUsage()?

```ts
optional getUsage(): Promise<StorageUsage>;
```

Defined in: [persistence/src/types.ts:227](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L227)

Estimate current storage usage for this backend.

This method is optional -- not all backends can report usage.

#### Returns

`Promise`\<[`StorageUsage`](StorageUsage.md)\>

Storage usage information including bytes used and quota (if available).

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

#### Inherited from

[`StorageBackend`](StorageBackend.md).[`load`](StorageBackend.md#load)

***

### loadWithMetadata()

```ts
loadWithMetadata(): Promise<PersistedSnapshot<T> | null>;
```

Defined in: [persistence/src/types.ts:218](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L218)

Load the most recent snapshot along with its metadata.

#### Returns

`Promise`\<[`PersistedSnapshot`](PersistedSnapshot.md)\<`T`\> \| `null`\>

The stored snapshot and metadata bundle, or `null` if nothing is persisted.

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

#### Inherited from

[`StorageBackend`](StorageBackend.md).[`save`](StorageBackend.md#save)

***

### saveWithMetadata()

```ts
saveWithMetadata(data): Promise<void>;
```

Defined in: [persistence/src/types.ts:211](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L211)

Save a snapshot together with its metadata to persistent storage.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | [`PersistedSnapshot`](PersistedSnapshot.md)\<`T`\> | The snapshot and metadata bundle to persist. |

#### Returns

`Promise`\<`void`\>

A promise that resolves when the write is complete.
