---
title: Vue (@statesync/vue)
---

## Installation

```bash
npm install @statesync/vue @statesync/core
```

## Purpose

`@statesync/vue` applies snapshots to Vue `reactive()` objects and `ref()` values.

## API

- `createVueSnapshotApplier(stateOrRef, options?)`
  - `target: 'reactive' | 'ref'` — which Vue primitive to target (default: `'reactive'`)
  - `mode: 'patch' | 'replace'`
  - `pickKeys` / `omitKeys` — protect local/ephemeral fields
  - `toState(data, ctx)` — map snapshot data to state shape
  - `strict` — throw on invalid mapping (default: `true`)

## Interfaces

```ts
interface VueRefLike<State> {
  value: State;
}

type VueTargetKind = 'ref' | 'reactive';
```

## Apply semantics

### `target: 'reactive'` (default)

Works like Valtio — mutates the reactive object in place (reference preserved):

| Mode | Behavior |
|------|----------|
| `'patch'` | `state[key] = value` for each filtered key |
| `'replace'` | `delete state[key]` for stale keys + `state[key] = value` |

### `target: 'ref'`

Works like Svelte — replaces `.value` with a new object:

| Mode | Behavior |
|------|----------|
| `'patch'` | `ref.value = { ...ref.value, ...patch }` |
| `'replace'` | `ref.value = rebuiltState` (preserving omitted keys) |

## Example (reactive)

```ts
import { createRevisionSync } from '@statesync/core';
import { createVueSnapshotApplier } from '@statesync/vue';
import { reactive } from 'vue';

const state = reactive({ count: 0, name: 'world' });

const applier = createVueSnapshotApplier(state, {
  mode: 'patch',
  omitKeys: ['localUiFlag'],
});

const sync = createRevisionSync({
  topic: 'app-config',
  subscriber,
  provider,
  applier,
});

await sync.start();
```

## Example (ref)

```ts
import { createVueSnapshotApplier } from '@statesync/vue';
import { ref } from 'vue';

const state = ref({ count: 0, name: 'world' });

const applier = createVueSnapshotApplier(state, {
  target: 'ref',
  mode: 'patch',
});
```

::: tip Can be used alongside @statesync/pinia
Pinia stores use `reactive()` internally — the Vue adapter works with both standalone Vue state and Pinia stores.
:::

## See also

- [Quickstart](/guide/quickstart) — full wiring example
- [Vue + Pinia + Tauri example](/examples/vue-pinia-tauri) — complete Tauri app
- [@statesync/pinia](/packages/pinia) — dedicated Pinia adapter
