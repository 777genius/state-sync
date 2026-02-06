[**@statesync/svelte**](../index.md)

***

[@statesync/svelte](../index.md) / createSvelteSnapshotApplier

# Function: createSvelteSnapshotApplier()

```ts
function createSvelteSnapshotApplier<State, Data>(store, options): SnapshotApplier<Data>;
```

Defined in: [svelte.ts:111](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/svelte/src/svelte.ts#L111)

Creates a SnapshotApplier that applies snapshots into a Svelte writable store.

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
| `store` | [`SvelteStoreLike`](../interfaces/SvelteStoreLike.md)\<`State`\> |
| `options` | [`SvelteSnapshotApplierOptions`](../type-aliases/SvelteSnapshotApplierOptions.md)\<`State`, `Data`\> |

## Returns

`SnapshotApplier`\<`Data`\>
