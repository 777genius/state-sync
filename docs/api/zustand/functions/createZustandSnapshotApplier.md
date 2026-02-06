[**@statesync/zustand**](../index.md)

***

[@statesync/zustand](../index.md) / createZustandSnapshotApplier

# Function: createZustandSnapshotApplier()

```ts
function createZustandSnapshotApplier<State, Data>(store, options): SnapshotApplier<Data>;
```

Defined in: zustand.ts:112

Creates a SnapshotApplier that applies snapshots into a Zustand store.

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
| `store` | [`ZustandStoreLike`](../interfaces/ZustandStoreLike.md)\<`State`\> |
| `options` | [`ZustandSnapshotApplierOptions`](../type-aliases/ZustandSnapshotApplierOptions.md)\<`State`, `Data`\> |

## Returns

`SnapshotApplier`\<`Data`\>
