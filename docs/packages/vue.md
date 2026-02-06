---
title: Vue (@statesync/vue)
---

## Purpose

`@statesync/vue` is a **framework adapter**: it knows how to apply snapshots to Vue `reactive()` objects and `ref()` values.

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

const handle = createRevisionSync({
  topic: 'app-config',
  subscriber,
  provider,
  applier,
});

await handle.start();
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

See: [Vue adapter notes](/adapters/vue).
