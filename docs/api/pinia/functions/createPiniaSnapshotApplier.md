[**@statesync/pinia**](../index.md)

***

[@statesync/pinia](../index.md) / createPiniaSnapshotApplier

# Function: createPiniaSnapshotApplier()

```ts
function createPiniaSnapshotApplier<State, Data>(store, options): SnapshotApplier<Data>;
```

Defined in: [pinia.ts:119](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/pinia/src/pinia.ts#L119)

Creates a SnapshotApplier that applies snapshots into a Pinia store.

This is a framework adapter: it only focuses on *how to apply a snapshot*
into a concrete state container. It does not fetch snapshots and does not
listen to invalidation events.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> | - |
| `Data` | `State` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `store` | [`PiniaStoreLike`](../interfaces/PiniaStoreLike.md)\<`State`\> |
| `options` | [`PiniaSnapshotApplierOptions`](../type-aliases/PiniaSnapshotApplierOptions.md)\<`State`, `Data`\> |

## Returns

`SnapshotApplier`\<`Data`\>
