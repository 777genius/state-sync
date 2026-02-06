---
title: Pinia (@statesync/pinia)
---

## Installation

```bash
npm install @statesync/pinia @statesync/core
```

## Purpose

`@statesync/pinia` applies snapshots to a Pinia store. No hard dependency on `pinia` at runtime — uses a structural interface (`PiniaStoreLike`).

## API

- `createPiniaSnapshotApplier(store, options?)`
  - `mode: 'patch' | 'replace'`
  - `pickKeys` / `omitKeys` — protect local/ephemeral fields
  - `toState(data)` — map snapshot data to store state shape

## Apply semantics

| Mode | Behavior | When to use |
|------|----------|-------------|
| `'patch'` (default) | `store.$patch(partial)` | Store has ephemeral/UI state that should survive |
| `'replace'` | `store.$patch()` with key delete + assign | Snapshot is authoritative full state |

## Example

```ts
import { createRevisionSync } from '@statesync/core';
import { createPiniaSnapshotApplier } from '@statesync/pinia';

const applier = createPiniaSnapshotApplier(myStore, {
  mode: 'patch',
  omitKeys: ['localUiFlag'],
});

const sync = createRevisionSync({
  topic: 'app-config',
  subscriber,  // see Quickstart for setup
  provider,    // see Quickstart for setup
  applier,
});

await sync.start();
```

## See also

- [Quickstart](/guide/quickstart) — full wiring example
- [Vue + Pinia + Tauri example](/examples/vue-pinia-tauri) — complete Tauri app
- [Writing state](/guide/writing-state) — patterns for the write path

