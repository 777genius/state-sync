[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / PersistenceEvents

# Interface: PersistenceEvents\<T\>

Defined in: [persistence/src/types.ts:428](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L428)

Map of persistence lifecycle event names to their handler signatures.

Subscribe to these events via [DisposablePersistenceApplier.on](DisposablePersistenceApplier.md#on) to
observe save/load activity, errors, and cache management events.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The shape of the application state. |

## Properties

### cleared()

```ts
cleared: () => void;
```

Defined in: [persistence/src/types.ts:480](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L480)

Emitted when persisted data is cleared from storage.

#### Returns

`void`

***

### expired()

```ts
expired: (snapshot, age) => void;
```

Defined in: [persistence/src/types.ts:468](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L468)

Emitted when a cached snapshot is discarded because its TTL has expired.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `snapshot` | `SnapshotEnvelope`\<`T`\> | The expired snapshot. |
| `age` | `number` | How old the snapshot was in milliseconds when it expired. |

#### Returns

`void`

***

### loadComplete()

```ts
loadComplete: (snapshot, durationMs) => void;
```

Defined in: [persistence/src/types.ts:460](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L460)

Emitted when a load operation completes (successfully or with no data).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `snapshot` | `SnapshotEnvelope`\<`T`\> \| `null` | The loaded snapshot, or `null` if nothing was stored. |
| `durationMs` | `number` | Wall-clock time the load took, in milliseconds. |

#### Returns

`void`

***

### migrated()

```ts
migrated: (result) => void;
```

Defined in: [persistence/src/types.ts:475](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L475)

Emitted when persisted data is successfully migrated to a newer schema version.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `result` | [`MigrationResult`](MigrationResult.md)\<`T`\> | The migration result including source/target versions and migrated data. |

#### Returns

`void`

***

### saveComplete()

```ts
saveComplete: (snapshot, durationMs) => void;
```

Defined in: [persistence/src/types.ts:442](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L442)

Emitted when a save operation completes successfully.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `snapshot` | `SnapshotEnvelope`\<`T`\> | The snapshot that was persisted. |
| `durationMs` | `number` | Wall-clock time the save took, in milliseconds. |

#### Returns

`void`

***

### saveError()

```ts
saveError: (error, snapshot) => void;
```

Defined in: [persistence/src/types.ts:452](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L452)

Emitted when a save operation fails.

The inner applier still receives the snapshot -- only persistence is affected.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `error` | `unknown` | The error thrown by the storage backend. |
| `snapshot` | `SnapshotEnvelope`\<`T`\> | The snapshot that failed to persist. |

#### Returns

`void`

***

### saveStart()

```ts
saveStart: (snapshot) => void;
```

Defined in: [persistence/src/types.ts:434](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L434)

Emitted when a save operation begins, before data is written to storage.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `snapshot` | `SnapshotEnvelope`\<`T`\> | The snapshot about to be persisted. |

#### Returns

`void`
