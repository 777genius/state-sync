[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / StorageBackendWithMetadata

# Interface: StorageBackendWithMetadata\<T\>

Defined in: [persistence/src/types.ts:111](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L111)

Extended storage backend with metadata support.

## Extends

- [`StorageBackend`](StorageBackend.md)\<`T`\>

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Methods

### clear()?

```ts
optional clear(): Promise<void>;
```

Defined in: [persistence/src/types.ts:105](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L105)

Optional: Clear stored data.

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`StorageBackend`](StorageBackend.md).[`clear`](StorageBackend.md#clear)

***

### getUsage()?

```ts
optional getUsage(): Promise<StorageUsage>;
```

Defined in: [persistence/src/types.ts:125](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L125)

Get storage usage estimate in bytes.

#### Returns

`Promise`\<[`StorageUsage`](StorageUsage.md)\>

***

### load()

```ts
load(): Promise<SnapshotEnvelope<T> | null>;
```

Defined in: [persistence/src/types.ts:100](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L100)

Load the most recent snapshot from persistent storage.
Returns null if no snapshot exists.

#### Returns

`Promise`\<`SnapshotEnvelope`\<`T`\> \| `null`\>

#### Inherited from

[`StorageBackend`](StorageBackend.md).[`load`](StorageBackend.md#load)

***

### loadWithMetadata()

```ts
loadWithMetadata(): Promise<PersistedSnapshot<T> | null>;
```

Defined in: [persistence/src/types.ts:120](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L120)

Load snapshot with metadata.

#### Returns

`Promise`\<[`PersistedSnapshot`](PersistedSnapshot.md)\<`T`\> \| `null`\>

***

### save()

```ts
save(snapshot): Promise<void>;
```

Defined in: [persistence/src/types.ts:94](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L94)

Save a snapshot to persistent storage.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `snapshot` | `SnapshotEnvelope`\<`T`\> |

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`StorageBackend`](StorageBackend.md).[`save`](StorageBackend.md#save)

***

### saveWithMetadata()

```ts
saveWithMetadata(data): Promise<void>;
```

Defined in: [persistence/src/types.ts:115](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L115)

Save snapshot with metadata.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | [`PersistedSnapshot`](PersistedSnapshot.md)\<`T`\> |

#### Returns

`Promise`\<`void`\>
