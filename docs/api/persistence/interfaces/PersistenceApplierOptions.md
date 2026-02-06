[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / PersistenceApplierOptions

# Interface: PersistenceApplierOptions\<T\>

Defined in: [persistence/src/types.ts:347](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L347)

Options for creating a persistence-enabled applier.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Properties

### applier

```ts
applier: object;
```

Defined in: [persistence/src/types.ts:356](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L356)

Inner applier to delegate snapshot application to.

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

Defined in: [persistence/src/types.ts:393](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L393)

Optional compression adapter.

***

### crossTabSync?

```ts
optional crossTabSync: CrossTabSyncOptions;
```

Defined in: [persistence/src/types.ts:404](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L404)

Enable cross-tab synchronization via BroadcastChannel.

***

### ~~debounceMs?~~

```ts
optional debounceMs: number;
```

Defined in: [persistence/src/types.ts:365](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L365)

Optional debounce for save operations (ms).
Prevents excessive writes during rapid updates.

#### Deprecated

Use `throttling.debounceMs` instead.

***

### enableHash?

```ts
optional enableHash: boolean;
```

Defined in: [persistence/src/types.ts:399](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L399)

Enable integrity hash verification.
Default: false

***

### onPersistenceError()?

```ts
optional onPersistenceError: (context) => void;
```

Defined in: [persistence/src/types.ts:376](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L376)

Optional error handler for persistence operations.
Called when save/load fails but does not prevent the inner applier from working.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`PersistenceErrorContext`](PersistenceErrorContext.md) |

#### Returns

`void`

***

### schemaVersion?

```ts
optional schemaVersion: number;
```

Defined in: [persistence/src/types.ts:382](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L382)

Schema version for migration support.
Default: 1

***

### storage

```ts
storage: StorageBackend<T>;
```

Defined in: [persistence/src/types.ts:351](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L351)

Storage backend to use for persistence.

***

### throttling?

```ts
optional throttling: SaveThrottlingOptions;
```

Defined in: [persistence/src/types.ts:370](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L370)

Advanced throttling options.

***

### ttlMs?

```ts
optional ttlMs: number;
```

Defined in: [persistence/src/types.ts:388](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L388)

Time-to-live for cached data in ms.
Expired data will not be loaded.
