---
title: Svelte (@statesync/svelte)
---

## Purpose

`@statesync/svelte` is a **framework adapter**: it knows how to apply snapshots to a Svelte writable store.

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

const handle = createRevisionSync({
  topic: 'app-config',
  subscriber,
  provider,
  applier,
});

await handle.start();
```

See: [Svelte adapter notes](/adapters/svelte).
