[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / PersistenceEvents

# Interface: PersistenceEvents\<T\>

Defined in: [persistence/src/types.ts:221](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L221)

Persistence event handlers.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Properties

### cleared()

```ts
cleared: () => void;
```

Defined in: [persistence/src/types.ts:255](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L255)

Emitted when storage is cleared.

#### Returns

`void`

***

### expired()

```ts
expired: (snapshot, age) => void;
```

Defined in: [persistence/src/types.ts:245](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L245)

Emitted when cache expires due to TTL.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `snapshot` | `SnapshotEnvelope`\<`T`\> |
| `age` | `number` |

#### Returns

`void`

***

### loadComplete()

```ts
loadComplete: (snapshot, durationMs) => void;
```

Defined in: [persistence/src/types.ts:240](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L240)

Emitted when load completes.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `snapshot` | `SnapshotEnvelope`\<`T`\> \| `null` |
| `durationMs` | `number` |

#### Returns

`void`

***

### migrated()

```ts
migrated: (result) => void;
```

Defined in: [persistence/src/types.ts:250](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L250)

Emitted when data is migrated.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `result` | [`MigrationResult`](MigrationResult.md)\<`T`\> |

#### Returns

`void`

***

### saveComplete()

```ts
saveComplete: (snapshot, durationMs) => void;
```

Defined in: [persistence/src/types.ts:230](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L230)

Emitted when save completes successfully.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `snapshot` | `SnapshotEnvelope`\<`T`\> |
| `durationMs` | `number` |

#### Returns

`void`

***

### saveError()

```ts
saveError: (error, snapshot) => void;
```

Defined in: [persistence/src/types.ts:235](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L235)

Emitted when save fails.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `error` | `unknown` |
| `snapshot` | `SnapshotEnvelope`\<`T`\> |

#### Returns

`void`

***

### saveStart()

```ts
saveStart: (snapshot) => void;
```

Defined in: [persistence/src/types.ts:225](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L225)

Emitted when save starts.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `snapshot` | `SnapshotEnvelope`\<`T`\> |

#### Returns

`void`
