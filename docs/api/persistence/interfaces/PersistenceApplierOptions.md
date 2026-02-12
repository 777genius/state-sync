[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / PersistenceApplierOptions

# Interface: PersistenceApplierOptions\<T\>

Defined in: [persistence/src/types.ts:636](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L636)

Configuration options for [createPersistenceApplier](../functions/createPersistenceApplier.md).

Controls which storage backend to use, how saves are throttled, schema
versioning, compression, integrity checking, cross-tab sync, and error handling.

## Example

```typescript
const options: PersistenceApplierOptions<MyState> = {
  storage: createLocalStorageBackend({ key: 'my-state' }),
  applier: myInnerApplier,
  throttling: { debounceMs: 300, maxWaitMs: 2000 },
  schemaVersion: 3,
  ttlMs: 24 * 60 * 60 * 1000,
  compression: createLZCompressionAdapter(),
};
```

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The shape of the application state being persisted. |

## Properties

### applier

```ts
applier: object;
```

Defined in: [persistence/src/types.ts:648](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L648)

The inner applier to which snapshot application is delegated.

The persistence applier always forwards snapshots to this applier first,
even if the subsequent storage write fails.

#### apply()

```ts
apply(snapshot): void | Promise<void>;
```

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `snapshot` | `SnapshotEnvelope`\<`T`\> |

##### Returns

`void` \| `Promise`\<`void`\>

***

### compression?

```ts
optional compression: CompressionAdapter;
```

Defined in: [persistence/src/types.ts:700](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L700)

Compression adapter to use for reducing the size of persisted data.

Applied after JSON serialization and before writing to storage.
The same adapter must be used for both saving and loading.

***

### crossTabSync?

```ts
optional crossTabSync: CrossTabSyncOptions;
```

Defined in: [persistence/src/types.ts:718](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L718)

Options for cross-tab synchronization via the BroadcastChannel API.

When provided, saves are broadcast to other tabs and incoming snapshots
from other tabs are applied to the inner applier.

***

### ~~debounceMs?~~

```ts
optional debounceMs: number;
```

Defined in: [persistence/src/types.ts:657](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L657)

Simple debounce delay in milliseconds for save operations.

#### Deprecated

Use [throttling](#throttling).debounceMs instead for more control.

***

### enableHash?

```ts
optional enableHash: boolean;
```

Defined in: [persistence/src/types.ts:710](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L710)

Whether to compute and store an integrity hash with each save.

When enabled, a non-cryptographic hash is stored in metadata and can
be verified during load via [LoadOptions.verifyHash](LoadOptions.md#verifyhash).

#### Default Value

`false`

***

### onPersistenceError()?

```ts
optional onPersistenceError: (context) => void;
```

Defined in: [persistence/src/types.ts:674](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L674)

Callback invoked when a persistence operation fails.

Errors in persistence do **not** prevent the inner applier from receiving
snapshots. Use this callback for logging, metrics, or user notification.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context` | [`PersistenceErrorContext`](PersistenceErrorContext.md) | Details about the failed operation. |

#### Returns

`void`

***

### schemaVersion?

```ts
optional schemaVersion: number;
```

Defined in: [persistence/src/types.ts:684](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L684)

The current schema version of the application state.

Stored in metadata alongside each snapshot. During load, the stored version
is compared to this value to determine if migration is needed.

#### Default Value

`1`

***

### storage

```ts
storage: StorageBackend<T>;
```

Defined in: [persistence/src/types.ts:640](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L640)

The storage backend used to read and write snapshots.

***

### throttling?

```ts
optional throttling: SaveThrottlingOptions;
```

Defined in: [persistence/src/types.ts:664](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L664)

Advanced throttling and debouncing options for save operations.

When provided, these take precedence over the deprecated [debounceMs](#debouncems).

***

### ttlMs?

```ts
optional ttlMs: number;
```

Defined in: [persistence/src/types.ts:692](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L692)

Time-to-live for cached snapshots, in milliseconds.

When set, snapshots older than this duration are discarded during load.
Set to `undefined` for no expiration.
