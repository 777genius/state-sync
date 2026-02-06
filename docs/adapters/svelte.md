## Svelte adapter

This adapter provides a `SnapshotApplier` implementation for Svelte writable stores.

### Package

- `@statesync/svelte`

### Design goals

- **No hard dependency** on `svelte` at runtime: the adapter uses a minimal structural interface (`SvelteStoreLike`).
- **Always produces new object references** — Svelte's reactivity system detects changes by reference comparison, so both modes create a new object.
- Supports both safe merging and authoritative replacement:
  - `mode: 'patch'` (default): `store.update(current => ({ ...current, ...patch }))`
  - `mode: 'replace'`: `store.update(_ => rebuiltState)` — new object, preserving omitted keys from current
- Supports mapping from snapshot data shape to store state shape using `toState`.

### API

- `SvelteStoreLike<State>` — structural interface (`set()`, `update()`)
- `createSvelteSnapshotApplier<State, Data>(store, options?)`

### Why spread (new reference)?

Svelte writable stores use reference equality to determine when to notify subscribers. If you mutate the existing object, `$store` reactive statements won't re-run. The adapter always creates a new object via spread or fresh construction.

### Replace mode details

In replace mode the adapter calls `store.update()` with a function that:
1. Preserves keys excluded by `omitKeys` from the current state
2. Applies allowed keys from the snapshot
3. Returns a new object (triggers Svelte reactivity)

### Usage (conceptual)

```ts
const applier = createSvelteSnapshotApplier(store, {
  mode: 'patch',
  toState: (data) => ({ a: data.a }),
});

await sync.start();
```

> Notes:
> - Prefer `mode: 'patch'` if your store contains ephemeral/derived state that should not be destroyed.
> - Prefer `mode: 'replace'` when the snapshot is authoritative and represents the full state.
