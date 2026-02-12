[**@statesync/zustand**](../index.md)

***

[@statesync/zustand](../index.md) / createZustandSnapshotApplier

# Function: createZustandSnapshotApplier()

```ts
function createZustandSnapshotApplier<State, Data>(store, options): SnapshotApplier<Data>;
```

Defined in: [zustand.ts:310](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/zustand/src/zustand.ts#L310)

Creates a SnapshotApplier that applies incoming snapshots into a
Zustand store.

This is a framework adapter: it only focuses on **how to apply a snapshot**
into a concrete Zustand state container. It does not fetch snapshots and
does not subscribe to invalidation events — those concerns belong to the
sync engine (`@statesync/core`).

**How state updates propagate:**

1. The sync engine receives an invalidation event and fetches a new
   snapshot from the server.
2. The engine calls `applier.apply(envelope)` with the snapshot data.
3. This adapter maps the snapshot data to a state patch (via `toState`),
   filters keys (via `pickKeys` / `omitKeys`), and applies the result
   to the Zustand store through `setState`.
4. Zustand notifies all subscribers (including React components using the
   store hook), triggering re-renders where the selected state has changed.

**Framework-specific note:** In `'replace'` mode, the adapter reads the
current state via `getState()`, preserves keys excluded by filters, and
performs an atomic swap with `setState(rebuilt, true)`. This ensures that
omitted keys (e.g., local UI state) survive a full snapshot replacement.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> | - | The shape of the Zustand store's state object. |
| `Data` | `State` | The snapshot payload type received from the sync engine. Defaults to `State` when the snapshot data matches the store shape directly. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `store` | [`ZustandStoreLike`](../interfaces/ZustandStoreLike.md)\<`State`\> | The Zustand store (or any object satisfying [ZustandStoreLike](../interfaces/ZustandStoreLike.md)) to apply snapshots into. |
| `options` | [`ZustandSnapshotApplierOptions`](../type-aliases/ZustandSnapshotApplierOptions.md)\<`State`, `Data`\> | Configuration for apply mode, key filtering, data mapping, and strict validation. See [ZustandSnapshotApplierOptions](../type-aliases/ZustandSnapshotApplierOptions.md). |

## Returns

`SnapshotApplier`\<`Data`\>

A SnapshotApplier whose `apply` method writes snapshot
  data into the Zustand store.

## Throws

When `strict` is `true` (the default) and `toState` returns
  a non-plain-object value.

## Examples

```ts
import { create } from 'zustand';
import { createZustandSnapshotApplier } from '@statesync/zustand';
import { createRevisionSync } from '@statesync/core';

interface ProfileState {
  name: string;
  email: string;
}

const useProfileStore = create<ProfileState>(() => ({
  name: '',
  email: '',
}));

const applier = createZustandSnapshotApplier(useProfileStore);

// Wire into the sync engine:
const sync = createRevisionSync({
  topic: 'user-profile',
  subscriber: mySubscriber,
  provider: mySnapshotProvider,
  applier,
});
```

```ts
const applier = createZustandSnapshotApplier(useProfileStore, {
  mode: 'replace',
  omitKeys: ['localUiFlag'],
});
```

```ts
interface ApiResponse { user: { name: string; email: string } }

const applier = createZustandSnapshotApplier<ProfileState, ApiResponse>(
  useProfileStore,
  { toState: (data) => data.user },
);
```
