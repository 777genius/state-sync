[**@statesync/pinia**](../index.md)

***

[@statesync/pinia](../index.md) / createPiniaSnapshotApplier

# Function: createPiniaSnapshotApplier()

```ts
function createPiniaSnapshotApplier<State, Data>(store, options): SnapshotApplier<Data>;
```

Defined in: [pinia.ts:305](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/pinia/src/pinia.ts#L305)

Creates a SnapshotApplier that applies incoming snapshots into a
Pinia store.

This is a framework adapter: it only focuses on **how to apply a snapshot**
into a concrete Pinia state container. It does not fetch snapshots and does
not subscribe to invalidation events — those concerns belong to the sync
engine (`@statesync/core`).

**How state updates propagate:**

1. The sync engine receives an invalidation event and fetches a new
   snapshot from the server.
2. The engine calls `applier.apply(envelope)` with the snapshot data.
3. This adapter maps the snapshot data to a state patch (via `toState`),
   filters keys (via `pickKeys` / `omitKeys`), and applies the result
   to the Pinia store through `$patch`.
4. Vue's reactivity system automatically re-renders any components that
   depend on the updated state.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> | - | The shape of the Pinia store's reactive state object. |
| `Data` | `State` | The snapshot payload type received from the sync engine. Defaults to `State` when the snapshot data matches the store shape directly. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `store` | [`PiniaStoreLike`](../interfaces/PiniaStoreLike.md)\<`State`\> | The Pinia store (or any object satisfying [PiniaStoreLike](../interfaces/PiniaStoreLike.md)) to apply snapshots into. |
| `options` | [`PiniaSnapshotApplierOptions`](../type-aliases/PiniaSnapshotApplierOptions.md)\<`State`, `Data`\> | Configuration for apply mode, key filtering, data mapping, and strict validation. See [PiniaSnapshotApplierOptions](../type-aliases/PiniaSnapshotApplierOptions.md). |

## Returns

`SnapshotApplier`\<`Data`\>

A SnapshotApplier whose `apply` method writes snapshot
  data into the Pinia store.

## Throws

When `strict` is `true` (the default) and `toState` returns
  a non-plain-object value.

## Examples

```ts
import { defineStore } from 'pinia';
import { createPiniaSnapshotApplier } from '@statesync/pinia';
import { createRevisionSync } from '@statesync/core';

const useProfileStore = defineStore('profile', {
  state: () => ({ name: '', email: '', age: 0 }),
});

const store = useProfileStore();
const applier = createPiniaSnapshotApplier(store);

// Wire into the sync engine:
const sync = createRevisionSync({
  topic: 'user-profile',
  subscriber: mySubscriber,
  provider: mySnapshotProvider,
  applier,
});
```

```ts
const applier = createPiniaSnapshotApplier(store, {
  mode: 'replace',
  omitKeys: ['localUiFlag'],
});
```

```ts
interface ApiResponse { user: { name: string; email: string } }

const applier = createPiniaSnapshotApplier<ProfileState, ApiResponse>(store, {
  toState: (data) => data.user,
});
```
