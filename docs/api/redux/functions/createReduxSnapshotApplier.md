[**@statesync/redux**](../index.md)

***

[@statesync/redux](../index.md) / createReduxSnapshotApplier

# Function: createReduxSnapshotApplier()

```ts
function createReduxSnapshotApplier<State, Data>(store, options): SnapshotApplier<Data>;
```

Defined in: redux.ts:387

Creates a SnapshotApplier that applies incoming snapshots into a
Redux store by dispatching a [SnapshotAppliedAction](../interfaces/SnapshotAppliedAction.md).

This is a framework adapter: it only focuses on **how to apply a snapshot**
into a concrete Redux state container. It does not fetch snapshots and does
not subscribe to invalidation events — those concerns belong to the sync
engine (`@statesync/core`).

**How state updates propagate:**

1. The sync engine receives an invalidation event and fetches a new
   snapshot from the server.
2. The engine calls `applier.apply(envelope)` with the snapshot data.
3. This adapter maps the snapshot data to a state patch (via `toState`),
   filters keys (via `pickKeys` / `omitKeys`), and dispatches a
   [SnapshotAppliedAction](../interfaces/SnapshotAppliedAction.md) to the Redux store.
4. A reducer (either wrapped with [withSnapshotHandling](withSnapshotHandling.md) or handling
   `SNAPSHOT_ACTION_TYPE` manually) processes the action and produces the
   next state.

**Key difference from other adapters:** Redux state can only be updated via
dispatching actions through reducers. This adapter dispatches a
well-defined action instead of mutating state directly.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> | - | The shape of the Redux store's state object. |
| `Data` | `State` | The snapshot payload type received from the sync engine. Defaults to `State` when the snapshot data matches the store shape. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `store` | [`ReduxStoreLike`](../interfaces/ReduxStoreLike.md)\<`State`\> | The Redux store (or any object satisfying [ReduxStoreLike](../interfaces/ReduxStoreLike.md)) to apply snapshots into. |
| `options` | [`ReduxSnapshotApplierOptions`](../type-aliases/ReduxSnapshotApplierOptions.md)\<`State`, `Data`\> | Configuration for apply mode, key filtering, data mapping, and strict validation. See [ReduxSnapshotApplierOptions](../type-aliases/ReduxSnapshotApplierOptions.md). |

## Returns

`SnapshotApplier`\<`Data`\>

A SnapshotApplier whose `apply` method dispatches snapshot
  data into the Redux store.

## Throws

When `strict` is `true` (the default) and `toState` returns
  a non-plain-object value.

## Examples

```ts
import { configureStore } from '@reduxjs/toolkit';
import { createReduxSnapshotApplier, withSnapshotHandling } from '@statesync/redux';
import { createRevisionSync } from '@statesync/core';

const store = configureStore({
  reducer: withSnapshotHandling(rootReducer),
});

const applier = createReduxSnapshotApplier(store);

const sync = createRevisionSync({
  topic: 'user-profile',
  subscriber: mySubscriber,
  provider: mySnapshotProvider,
  applier,
});
```

```ts
const applier = createReduxSnapshotApplier(store, {
  mode: 'replace',
  omitKeys: ['localUiFlag'],
});
```

```ts
interface ApiResponse { user: { name: string; email: string } }

const applier = createReduxSnapshotApplier<ProfileState, ApiResponse>(
  store,
  { toState: (data) => data.user },
);
```
