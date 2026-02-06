## Zustand adapter

This adapter provides a `SnapshotApplier` implementation for Zustand stores.

### Package

- `@statesync/zustand`

### Design goals

- **No hard dependency** on `zustand` at runtime: the adapter uses a minimal structural interface (`ZustandStoreLike`).
- Supports both safe merging updates and authoritative replacement:
  - `mode: 'patch'` (default): `store.setState(partial)` — shallow merge
  - `mode: 'replace'`: `store.setState(nextState, true)` — atomic swap using Zustand's native `replace` flag
- Supports mapping from snapshot data shape to store state shape using `toState`.

### API

- `ZustandStoreLike<State>` — structural interface (`getState()`, `setState()`)
- `createZustandSnapshotApplier<State, Data>(store, options?)`

### Replace mode details

In replace mode the adapter:
1. Reads current state via `store.getState()`
2. Preserves keys excluded by `omitKeys` from current state
3. Merges in allowed keys from the snapshot
4. Calls `store.setState(rebuilt, true)` — replacing the entire state atom

This ensures omitted keys survive replacement while stale keys are removed.

### Usage (conceptual)

```ts
const applier = createZustandSnapshotApplier(useStore, {
  mode: 'patch',
  toState: (data) => ({ count: data.count }),
});

await sync.start();
```

> Notes:
> - Prefer `mode: 'patch'` if your store contains ephemeral/derived state that should not be destroyed.
> - Prefer `mode: 'replace'` when the snapshot is authoritative and represents the full state.
