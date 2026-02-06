[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / StorageBackend

# Interface: StorageBackend\<T\>

Defined in: [persistence/src/types.ts:90](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L90)

Abstract storage backend for persisting snapshots.

Implementations must handle serialization/deserialization internally.
The save/load methods work with SnapshotEnvelope to preserve revision metadata.

## Extended by

- [`StorageBackendWithMetadata`](StorageBackendWithMetadata.md)

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
