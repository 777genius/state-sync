---
title: Zustand (@statesync/zustand)
---

## Installation

```bash
npm install @statesync/zustand @statesync/core
```

## Purpose

`@statesync/zustand` applies snapshots to a Zustand store. No hard dependency on `zustand` at runtime — uses a structural interface.

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
- [React + Zustand example](/examples/react-zustand) — shopping cart synced across tabs
- [Multi-window patterns](/guide/multi-window) — cross-tab architecture
```

::: tip Replace mode details
In replace mode: reads current state → preserves `omitKeys` → merges snapshot → calls `setState(rebuilt, true)`. This ensures omitted keys survive while stale keys are removed.
:::
