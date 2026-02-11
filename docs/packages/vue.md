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

`createVueSnapshotApplier(stateOrRef, options?)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `target` | `'reactive' \| 'ref'` | `'reactive'` | Which Vue primitive to target |
| `mode` | `'patch' \| 'replace'` | `'patch'` | Apply strategy (see below) |
| `pickKeys` | `ReadonlyArray<keyof State>` | — | Only update these keys (mutually exclusive with `omitKeys`) |
| `omitKeys` | `ReadonlyArray<keyof State>` | — | Protect these keys from updates |
| `toState` | `(data, ctx) => Partial<State>` | identity | Map snapshot data to state shape. `ctx` contains `{ state }` for reactive or `{ ref }` for ref target |
| `strict` | `boolean` | `true` | Throw if `toState` returns a non-object |

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

const state = reactive({ count: 0, name: 'world', isEditing: false });

const applier = createVueSnapshotApplier(state, {
  mode: 'patch',
  omitKeys: ['isEditing'],
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

### Using in a Vue component

```vue
<script setup>
import { onMounted, onUnmounted, reactive } from 'vue';
import { createRevisionSync } from '@statesync/core';
import { createVueSnapshotApplier } from '@statesync/vue';

const state = reactive({ theme: 'light', locale: 'en' });

const applier = createVueSnapshotApplier(state, { mode: 'patch' });
const sync = createRevisionSync({ topic: 'prefs', subscriber, provider, applier });

onMounted(() => sync.start());
onUnmounted(() => sync.stop());
</script>

<template>
  <p>Theme: {{ state.theme }}</p>
</template>
```

::: tip Can be used alongside @statesync/pinia
Pinia stores use `reactive()` internally — the Vue adapter works with both standalone Vue state and Pinia stores. For Pinia-specific features (`$patch`, `$state`), use the dedicated [@statesync/pinia](/packages/pinia) adapter.
:::

## See also

- [Quickstart](/guide/quickstart) — full wiring example
- [Vue + Pinia + Tauri example](/examples/vue-pinia-tauri) — complete Tauri app
- [@statesync/pinia](/packages/pinia) — dedicated Pinia adapter
