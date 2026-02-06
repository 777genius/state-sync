---
title: Svelte (@statesync/svelte)
---

## Installation

```bash
npm install @statesync/svelte @statesync/core
```

## Purpose

`@statesync/svelte` applies snapshots to a Svelte `writable()` store. Both modes always produce a **new object reference**, required for Svelte's reactivity.

## API

- `createSvelteSnapshotApplier(store, options?)`
  - `mode: 'patch' | 'replace'`
  - `pickKeys` / `omitKeys` — protect local/ephemeral fields
  - `toState(data, ctx)` — map snapshot data to state shape
  - `strict` — throw on invalid mapping (default: `true`)

## Store interface

The adapter uses a structural interface — no `svelte` import required:

```ts
interface SvelteStoreLike<State> {
  set(value: State): void;
  update(updater: (current: State) => State): void;
}
```

Any Svelte `writable()` store satisfies this interface automatically.

## Apply semantics

| Mode | Behavior |
|------|----------|
| `'patch'` (default) | `store.update(current => ({ ...current, ...patch }))` — spread creates new reference for Svelte reactivity |
| `'replace'` | `store.update(_ => rebuiltState)` — new object preserving omitted keys from current state |

Both modes always produce a **new object reference**, which is required for Svelte's reactivity system to detect changes.

## Example

```ts
import { createRevisionSync } from '@statesync/core';
import { createSvelteSnapshotApplier } from '@statesync/svelte';
import { writable } from 'svelte/store';

const store = writable({ count: 0, name: 'world' });

const applier = createSvelteSnapshotApplier(store, {
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

## See also

- [Quickstart](/guide/quickstart) — full wiring example
- [Multi-window patterns](/guide/multi-window) — cross-tab architecture
- [Custom transports](/guide/custom-transports) — build your own subscriber/provider
```

::: tip Svelte 5 runes
Current adapter targets `writable()` stores (Svelte 4 API). For Svelte 5 runes (`$state`), wrap in a `writable()`-compatible interface or use a custom applier.
:::
