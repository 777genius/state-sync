---
title: Zustand (@statesync/zustand)
---

## Purpose

`@statesync/zustand` is a **framework adapter**: it knows how to apply snapshots to a Zustand store.

## API

- `createZustandSnapshotApplier(store, options?)`
  - `mode: 'patch' | 'replace'`
  - `pickKeys` / `omitKeys` — protect local/ephemeral fields
  - `toState(data, ctx)` — map snapshot data to state shape
  - `strict` — throw on invalid mapping (default: `true`)

## Store interface

The adapter uses a structural interface — no `zustand` import required:

```ts
interface ZustandStoreLike<State> {
  getState(): State;
  setState(
    partial: State | Partial<State> | ((s: State) => State | Partial<State>),
    replace?: boolean,
  ): void;
}
```

Any Zustand store created via `create()` satisfies this interface automatically.

## Apply semantics

| Mode | Behavior |
|------|----------|
| `'patch'` (default) | `store.setState(filteredPatch)` — shallow merge |
| `'replace'` | Builds new state keeping omitted keys, then `store.setState(rebuilt, true)` — atomic swap |

## Example

```ts
import { createRevisionSync } from '@statesync/core';
import { createZustandSnapshotApplier } from '@statesync/zustand';

const applier = createZustandSnapshotApplier(useMyStore, {
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

See: [Zustand adapter notes](/adapters/zustand).
