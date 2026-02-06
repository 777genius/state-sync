## Valtio adapter

This adapter provides a `SnapshotApplier` implementation for Valtio proxies.

### Package

- `@statesync/valtio`

### Design goals

- **No hard dependency** on `valtio` at runtime: the adapter accepts any mutable object (`ValtioProxyLike<State> = State`).
- **Proxy reference is never replaced** — mutations are applied directly on the proxy object so that existing Valtio subscribers (`useSnapshot`, `subscribe`) continue to work.
- Supports both safe merging and authoritative replacement:
  - `mode: 'patch'` (default): `proxy[key] = value` for each allowed key
  - `mode: 'replace'`: `delete proxy[key]` for stale keys + `proxy[key] = value`
- Supports mapping from snapshot data shape to proxy state shape using `toState`.

### API

- `ValtioProxyLike<State>` — type alias (just `State` itself)
- `createValtioSnapshotApplier<State, Data>(proxy, options?)`

### Context parameter

The `toState` callback receives `{ proxy }` (not `{ store }`) to match Valtio terminology:

```ts
const applier = createValtioSnapshotApplier(myProxy, {
  toState: (data, { proxy }) => ({ count: data.count }),
});
```

### Why not replace the proxy reference?

Valtio's reactivity relies on the original proxy reference. Replacing it with a new object would break all existing `useSnapshot()` hooks and `subscribe()` callbacks. The adapter always mutates the proxy in place.

### Usage (conceptual)

```ts
const applier = createValtioSnapshotApplier(state, {
  mode: 'patch',
  toState: (data) => ({ a: data.a }),
});

await sync.start();
```

> Notes:
> - Prefer `mode: 'patch'` if your proxy contains ephemeral/derived state that should not be destroyed.
> - Prefer `mode: 'replace'` when the snapshot is authoritative and represents the full state.
