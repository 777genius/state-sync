---
title: Svelte (@statesync/svelte)
---

## Installation

```bash
npm install @statesync/svelte @statesync/core
```

## Purpose

`@statesync/svelte` applies snapshots to Svelte state containers. It supports two targets:

- **`'store'`** (default) — Svelte 4 `writable()` stores. Always produces a new object reference (required for store reactivity).
- **`'state'`** — Svelte 5 `$state` runes. Mutates the reactive proxy in-place (how `$state` tracks changes).

## API

`createSvelteSnapshotApplier(storeOrState, options?)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `target` | `'store' \| 'state'` | `'store'` | `'store'` for `writable()`, `'state'` for `$state` runes |
| `mode` | `'patch' \| 'replace'` | `'patch'` | Apply strategy (see below) |
| `pickKeys` | `ReadonlyArray<keyof State>` | — | Only update these keys (mutually exclusive with `omitKeys`) |
| `omitKeys` | `ReadonlyArray<keyof State>` | — | Protect these keys from updates |
| `toState` | `(data, ctx) => Partial<State>` | identity | Map snapshot data to state shape. `ctx` contains `{ store }` or `{ state }` depending on target |
| `strict` | `boolean` | `true` | Throw if `toState` returns a non-object |

## Store interface

For `target: 'store'`, the adapter uses a structural interface — no `svelte` import required:

```ts
interface SvelteStoreLike<State> {
  set(value: State): void;
  update(updater: (current: State) => State): void;
}
```

Any Svelte `writable()` store satisfies this interface automatically.

For `target: 'state'`, pass any plain `$state` object directly.

## Apply semantics

### target: 'store' (Svelte 4)

| Mode | Behavior |
|------|----------|
| `'patch'` (default) | `store.update(current => ({ ...current, ...patch }))` — new reference |
| `'replace'` | `store.update(_ => rebuiltState)` — new reference, preserving omitted keys |

### target: 'state' (Svelte 5)

| Mode | Behavior |
|------|----------|
| `'patch'` (default) | `state[key] = value` for each key — in-place mutation, identity preserved |
| `'replace'` | `delete state[key]` for stale keys + `state[key] = value` for new — identity preserved |

## Examples

### Svelte 4 — writable store

```ts
import { createRevisionSync } from '@statesync/core';
import { createSvelteSnapshotApplier } from '@statesync/svelte';
import { writable } from 'svelte/store';

const store = writable({
  theme: 'light',
  locale: 'en',
  sidebarOpen: false,
});

const applier = createSvelteSnapshotApplier(store, {
  mode: 'patch',
  omitKeys: ['sidebarOpen'],
});

const sync = createRevisionSync({
  topic: 'user-prefs',
  subscriber,
  provider,
  applier,
});

await sync.start();
```

### Svelte 5 — $state rune

```ts
import { createRevisionSync } from '@statesync/core';
import { createSvelteSnapshotApplier } from '@statesync/svelte';

let settings = $state({
  theme: 'light',
  locale: 'en',
  sidebarOpen: false,
});

const applier = createSvelteSnapshotApplier(settings, {
  target: 'state', // [!code highlight]
  mode: 'patch',
  omitKeys: ['sidebarOpen'],
});

const sync = createRevisionSync({
  topic: 'user-prefs',
  subscriber,
  provider,
  applier,
});

await sync.start();
```

### Using in a Svelte 4 component

```svelte
<script>
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  import { createRevisionSync } from '@statesync/core';
  import { createSvelteSnapshotApplier } from '@statesync/svelte';

  const settings = writable({ theme: 'light', locale: 'en' });

  const applier = createSvelteSnapshotApplier(settings, { mode: 'patch' });
  const sync = createRevisionSync({ topic: 'settings', subscriber, provider, applier });

  onMount(() => sync.start());
  onDestroy(() => sync.stop());
</script>

<p>Theme: {$settings.theme}</p>
```

## See also

- [Svelte 5 Runes guide](/guide/svelte5-runes) — detailed patterns for `$state`
- [Quickstart](/guide/quickstart) — full wiring example
- [Multi-window patterns](/guide/multi-window) — cross-tab architecture
- [Custom transports](/guide/custom-transports) — build your own subscriber/provider
