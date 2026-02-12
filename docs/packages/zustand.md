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

`createZustandSnapshotApplier(store, options?)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | `'patch' \| 'replace'` | `'patch'` | Apply strategy (see below) |
| `pickKeys` | `ReadonlyArray<keyof State>` | — | Only update these keys (mutually exclusive with `omitKeys`) |
| `omitKeys` | `ReadonlyArray<keyof State>` | — | Protect these keys from updates |
| `toState` | `(data, ctx) => Partial<State>` | identity | Map snapshot data to state shape. `ctx` contains `{ store }` |
| `strict` | `boolean` | `true` | Throw if `toState` returns a non-object |

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

::: tip Replace mode details
In replace mode: reads current state, preserves `omitKeys`, merges snapshot, calls `setState(rebuilt, true)`. This ensures omitted keys survive while stale keys are removed.
:::

## Example

```ts
import { createRevisionSync } from '@statesync/core';
import { createZustandSnapshotApplier } from '@statesync/zustand';
import { useCartStore } from './stores/cart';

const applier = createZustandSnapshotApplier(useCartStore, {
  mode: 'patch',
  omitKeys: ['isCheckingOut'],
});

const sync = createRevisionSync({
  topic: 'cart',
  subscriber,
  provider,
  applier,
});

await sync.start();
```

### With toState mapping

```ts
interface CartDTO {
  items: Array<{ sku: string; qty: number }>;
  total: number;
}

const applier = createZustandSnapshotApplier(useCartStore, {
  toState: (data: CartDTO, { store }) => ({
    items: data.items,
    totalPrice: data.total,
  }),
});
```

## See also

- [Quickstart](/guide/quickstart) — full wiring example
- [React + Zustand example](/examples/react-zustand) — shopping cart synced across tabs
- [Multi-window patterns](/guide/multi-window) — cross-tab architecture
