## Vue adapter

This adapter provides a `SnapshotApplier` implementation for Vue `reactive()` objects and `ref()` values.

### Package

- `@statesync/vue`

### Design goals

- **No hard dependency** on `vue` at runtime: the adapter uses minimal structural interfaces (`VueRefLike`).
- Supports two Vue primitives via `target` option:
  - `'reactive'` (default): mutates the reactive object in place (reference preserved)
  - `'ref'`: replaces `ref.value` with a new object (triggers Vue watchers)
- Supports both safe merging and authoritative replacement:
  - `mode: 'patch'`: merge keys into existing state
  - `mode: 'replace'`: remove stale keys + set new keys
- Supports mapping from snapshot data shape to state shape using `toState`.

### API

- `VueRefLike<State>` — structural interface (`{ value: State }`)
- `VueTargetKind` — `'ref' | 'reactive'`
- `createVueSnapshotApplier<State, Data>(stateOrRef, options?)`

### Two target modes

#### `target: 'reactive'` (default)

Behaves like the Valtio adapter — mutates the reactive object directly:

- **Patch**: `state[key] = value` for each allowed key
- **Replace**: `delete state[key]` for stale keys, then `state[key] = value`

The object reference stays the same, so Vue's deep reactivity continues to work.

#### `target: 'ref'`

Behaves like the Svelte adapter — replaces `ref.value`:

- **Patch**: `ref.value = { ...ref.value, ...patch }`
- **Replace**: `ref.value = rebuiltState`

A new object reference is assigned, which triggers Vue `watch()` and computed properties.

### When to use `reactive` vs `ref`

| Use `reactive` when | Use `ref` when |
|---------------------|----------------|
| State is a plain object | State could be any type (incl. primitives) |
| You access `state.key` directly | You use `state.value.key` |
| You want granular property tracking | You want simple replacement semantics |
| Pinia stores (internal state is reactive) | Composables that return `ref()` |

### Context parameter

The `toState` callback context depends on the target:
- `reactive`: receives `{ state }` — the reactive object
- `ref`: receives `{ ref }` — the ref wrapper

### Usage (conceptual)

```ts
// reactive
const applier = createVueSnapshotApplier(state, {
  mode: 'patch',
  toState: (data) => ({ a: data.a }),
});

// ref
const applier = createVueSnapshotApplier(myRef, {
  target: 'ref',
  mode: 'replace',
});

await sync.start();
```

> Notes:
> - Prefer `mode: 'patch'` if your state contains ephemeral/derived data that should not be destroyed.
> - Prefer `mode: 'replace'` when the snapshot is authoritative and represents the full state.
> - The Vue adapter can be used **alongside** `@statesync/pinia` — Pinia stores use `reactive()` internally.
