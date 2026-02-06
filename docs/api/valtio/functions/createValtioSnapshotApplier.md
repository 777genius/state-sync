[**@statesync/valtio**](../index.md)

***

[@statesync/valtio](../index.md) / createValtioSnapshotApplier

# Function: createValtioSnapshotApplier()

```ts
function createValtioSnapshotApplier<State, Data>(proxy, options): SnapshotApplier<Data>;
```

Defined in: valtio.ts:100

Creates a SnapshotApplier that applies snapshots into a Valtio proxy.

This is a framework adapter: it only focuses on *how to apply a snapshot*
into a concrete state container. It does not fetch snapshots and does not
listen to invalidation events.

The proxy reference is never replaced — mutations are applied directly
so that existing Valtio subscribers continue to work.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> | - |
| `Data` | `State` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `proxy` | `State` |
| `options` | [`ValtioSnapshotApplierOptions`](../type-aliases/ValtioSnapshotApplierOptions.md)\<`State`, `Data`\> |

## Returns

`SnapshotApplier`\<`Data`\>
