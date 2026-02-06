# @statesync/vue

## 2.0.0

### Minor Changes

- Add framework adapters for Zustand, Valtio, Svelte, and Vue

  ## @statesync/zustand (new package)

  - `createZustandSnapshotApplier()` — applies snapshots into Zustand stores
  - `ZustandStoreLike<State>` structural interface (no zustand import needed)
  - Patch mode: `setState(partial)` — shallow merge
  - Replace mode: `setState(rebuilt, true)` — atomic swap preserving omitted keys

  ## @statesync/valtio (new package)

  - `createValtioSnapshotApplier()` — applies snapshots into Valtio proxies
  - Direct proxy mutation — reference never changes (subscribers keep working)
  - Patch mode: `proxy[key] = value` for each filtered key
  - Replace mode: `delete` stale keys + assign new keys

  ## @statesync/svelte (new package)

  - `createSvelteSnapshotApplier()` — applies snapshots into Svelte writable stores
  - `SvelteStoreLike<State>` structural interface (`set()`, `update()`)
  - Always creates new object reference for Svelte reactivity
  - Patch mode: `store.update(current => ({ ...current, ...patch }))`
  - Replace mode: `store.update(_ => rebuiltState)`

  ## @statesync/vue (new package)

  - `createVueSnapshotApplier()` — applies snapshots into Vue reactive/ref values
  - Two target modes: `'reactive'` (mutate in place) and `'ref'` (replace `.value`)
  - `VueRefLike<State>` structural interface (no vue import needed)
  - Full `pickKeys`/`omitKeys`, `toState` mapping, `strict` mode support

### Patch Changes

- Updated dependencies
  - @statesync/core@0.2.0
