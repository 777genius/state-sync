## Pinia adapter

This adapter provides a `SnapshotApplier` implementation for Pinia stores.

### Package

- `@statesync/pinia`

### Design goals

- **No hard dependency** on `pinia` at runtime: the adapter uses a minimal structural interface (`PiniaStoreLike`).
- Supports both safe merging updates and authoritative replacement:
  - `mode: 'patch'` (default): `store.$patch(partial)`
  - `mode: 'replace'`: `store.$state = nextState`
- Supports mapping from snapshot data shape to store state shape using `toState`.

### API

- `PiniaStoreLike<State>`
- `createPiniaSnapshotApplier<State, Data>(store, options?)`

### Usage (conceptual)

```ts
const applier = createPiniaSnapshotApplier(store, {
  mode: 'patch',
  toState: (data) => ({ a: data.a }),
});

await sync.start();
```

> Notes:
> - Prefer `mode: 'patch'` if your store contains ephemeral/derived state that should not be destroyed.
> - Prefer `mode: 'replace'` when the snapshot is authoritative and represents the full state.

