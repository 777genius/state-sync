[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / DisposablePersistenceApplier

# Interface: DisposablePersistenceApplier\<T\>

Defined in: [persistence/src/types.ts:12](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L12)

Extended SnapshotApplier with dispose capability.

Call dispose() when stopping sync to clean up pending debounce timers.

## Extends

- `SnapshotApplier`\<`T`\>

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Methods

### apply()

```ts
apply(snapshot): void | Promise<void>;
```

Defined in: [core/src/types.ts:56](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/core/src/types.ts#L56)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `snapshot` | `SnapshotEnvelope`\<`T`\> |

#### Returns

`void` \| `Promise`\<`void`\>

#### Inherited from

```ts
SnapshotApplier.apply
```

***

### dispose()

```ts
dispose(): void;
```

Defined in: [persistence/src/types.ts:17](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L17)

Cancels any pending debounced save operations.
Should be called when sync is stopped.

#### Returns

`void`

***

### flush()

```ts
flush(): Promise<void>;
```

Defined in: [persistence/src/types.ts:28](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L28)

Forces an immediate save of the last snapshot (if any pending).
Useful before dispose() if you want to ensure data is saved.

#### Returns

`Promise`\<`void`\>

***

### getStats()

```ts
getStats(): PersistenceStats;
```

Defined in: [persistence/src/types.ts:38](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L38)

Get current persistence statistics.

#### Returns

[`PersistenceStats`](PersistenceStats.md)

***

### hasPendingSave()

```ts
hasPendingSave(): boolean;
```

Defined in: [persistence/src/types.ts:22](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L22)

Returns true if there's a pending save operation.

#### Returns

`boolean`

***

### on()

```ts
on<K>(event, handler): () => void;
```

Defined in: [persistence/src/types.ts:33](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L33)

Subscribe to persistence events.

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* keyof [`PersistenceEvents`](PersistenceEvents.md)\<`T`\> |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `K` |
| `handler` | [`PersistenceEvents`](PersistenceEvents.md)\<`T`\>\[`K`\] |

#### Returns

```ts
(): void;
```

##### Returns

`void`
