[**state-sync-pinia**](../index.md)

***

[state-sync-pinia](../index.md) / createPiniaSnapshotApplier

# Function: createPiniaSnapshotApplier()

```ts
function createPiniaSnapshotApplier<State, Data>(store, options): SnapshotApplier<Data>;
```

Defined in: [pinia.ts:119](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/pinia/src/pinia.ts#L119)

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
