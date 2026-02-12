[**@statesync/valtio**](../index.md)

***

[@statesync/valtio](../index.md) / createValtioSnapshotApplier

# Function: createValtioSnapshotApplier()

```ts
function createValtioSnapshotApplier<State, Data>(proxy, options): SnapshotApplier<Data>;
```

Defined in: [valtio.ts:296](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/valtio/src/valtio.ts#L296)

Creates a SnapshotApplier that applies incoming snapshots into a
Valtio proxy.

This is a framework adapter: it only focuses on **how to apply a snapshot**
into a concrete Valtio state container. It does not fetch snapshots and
does not subscribe to invalidation events — those concerns belong to the
sync engine (`@statesync/core`).

**How state updates propagate:**

1. The sync engine receives an invalidation event and fetches a new
   snapshot from the server.
2. The engine calls `applier.apply(envelope)` with the snapshot data.
3. This adapter maps the snapshot data to a state patch (via `toState`),
   filters keys (via `pickKeys` / `omitKeys`), and mutates the Valtio
   proxy in place by assigning or deleting individual properties.
4. Valtio's proxy tracking automatically notifies all subscribers
   (including React components using `useSnapshot(proxy)`) of the
   changed properties, triggering granular re-renders.

**Framework-specific note:** The proxy reference is **never replaced**.
All mutations are applied directly to the existing proxy object so that
`useSnapshot()`, `subscribe()`, and `watch()` consumers continue to work
without any re-wiring. This is the key difference from the Zustand adapter
(which swaps the entire state object in `'replace'` mode) and the Pinia
adapter (which uses `$patch`).

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> | - | The shape of the Valtio proxy's state object. |
| `Data` | `State` | The snapshot payload type received from the sync engine. Defaults to `State` when the snapshot data matches the proxy shape directly. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `proxy` | `State` | The Valtio proxy (or any object satisfying [ValtioProxyLike](../type-aliases/ValtioProxyLike.md)) to apply snapshots into. |
| `options` | [`ValtioSnapshotApplierOptions`](../type-aliases/ValtioSnapshotApplierOptions.md)\<`State`, `Data`\> | Configuration for apply mode, key filtering, data mapping, and strict validation. See [ValtioSnapshotApplierOptions](../type-aliases/ValtioSnapshotApplierOptions.md). |

## Returns

`SnapshotApplier`\<`Data`\>

A SnapshotApplier whose `apply` method writes snapshot
  data into the Valtio proxy.

## Throws

When `strict` is `true` (the default) and `toState` returns
  a non-plain-object value.

## Examples

```ts
import { proxy } from 'valtio';
import { createValtioSnapshotApplier } from '@statesync/valtio';
import { createRevisionSync } from '@statesync/core';

interface ProfileState {
  name: string;
  email: string;
}

const profileProxy = proxy<ProfileState>({ name: '', email: '' });
const applier = createValtioSnapshotApplier(profileProxy);

// Wire into the sync engine:
const sync = createRevisionSync({
  topic: 'user-profile',
  subscriber: mySubscriber,
  provider: mySnapshotProvider,
  applier,
});
```

```tsx
import { useSnapshot } from 'valtio';

function ProfileCard() {
  const snap = useSnapshot(profileProxy);
  return <div>{snap.name} — {snap.email}</div>;
}
// When the sync engine applies a new snapshot, the component
// automatically re-renders with the updated values.
```

```ts
const applier = createValtioSnapshotApplier(profileProxy, {
  mode: 'replace',
  omitKeys: ['localUiFlag'],
});
```

```ts
interface ApiResponse { user: { name: string; email: string } }

const applier = createValtioSnapshotApplier<ProfileState, ApiResponse>(
  profileProxy,
  { toState: (data) => data.user },
);
```
