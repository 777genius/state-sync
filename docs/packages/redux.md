---
title: Redux (@statesync/redux)
---

## Installation

```bash
npm install @statesync/redux @statesync/core
```

## Purpose

`@statesync/redux` applies snapshots to a Redux store. No hard dependency on `redux` or `@reduxjs/toolkit` at runtime — uses a structural interface.

Redux state can only be updated via dispatching actions through reducers. This adapter dispatches a well-defined `@@statesync/SNAPSHOT_APPLIED` action instead of mutating state directly.

## Two approaches

### 1. `withSnapshotHandling(reducer)` — zero-config HOF

Wrap your root reducer (or any sub-reducer) to automatically handle snapshot actions:

```ts
import { configureStore } from '@reduxjs/toolkit';
import { withSnapshotHandling } from '@statesync/redux';

const store = configureStore({
  reducer: withSnapshotHandling(rootReducer),
});
```

### 2. Manual `extraReducers` in RTK slices

Use `snapshotApplied.type` with RTK `builder.addCase`:

```ts
import { createSlice } from '@reduxjs/toolkit';
import { snapshotApplied } from '@statesync/redux';

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [], total: 0 },
  reducers: { /* ... */ },
  extraReducers: (builder) => {
    builder.addCase(snapshotApplied.type, (state, action) => {
      return { ...state, ...action.payload };
    });
  },
});
```

## API

`createReduxSnapshotApplier(store, options?)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | `'patch' \| 'replace'` | `'patch'` | Apply strategy (see below) |
| `pickKeys` | `ReadonlyArray<keyof State>` | — | Only update these keys (mutually exclusive with `omitKeys`) |
| `omitKeys` | `ReadonlyArray<keyof State>` | — | Protect these keys from updates |
| `toState` | `(data, ctx) => Partial<State>` | identity | Map snapshot data to state shape. `ctx` contains `{ store }` |
| `strict` | `boolean` | `true` | Throw if `toState` returns a non-object |

### Additional exports

| Export | Type | Description |
|--------|------|-------------|
| `withSnapshotHandling(reducer)` | HOF | Wraps a reducer to handle snapshot actions |
| `snapshotApplied(payload, meta)` | action creator | Creates the snapshot action (has `.type` for RTK) |
| `SNAPSHOT_ACTION_TYPE` | `string` | `'@@statesync/SNAPSHOT_APPLIED'` |

## Store interface

The adapter uses a structural interface — no `redux` import required:

```ts
interface ReduxStoreLike<State> {
  getState(): State;
  dispatch(action: SnapshotAppliedAction<State>): unknown;
}
```

Any Redux store created via `configureStore()` or `createStore()` satisfies this interface automatically.

## Apply semantics

| Mode | Behavior |
|------|----------|
| `'patch'` (default) | Dispatches action with partial state — reducer shallow-merges |
| `'replace'` | Builds new state keeping omitted keys, dispatches action with full state |

::: tip Replace mode details
In replace mode: reads current state via `getState()`, preserves `omitKeys`, merges snapshot, dispatches the rebuilt state. This ensures omitted keys survive a full snapshot replacement.
:::

::: info Key difference from other adapters
```
Zustand:  apply() → toState() → filter() → store.setState(patch)
Redux:    apply() → toState() → filter() → store.dispatch(action) → reducer handles
```
:::

## Example

```ts
import { createRevisionSync } from '@statesync/core';
import { createReduxSnapshotApplier, withSnapshotHandling } from '@statesync/redux';
import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from './store';

const store = configureStore({
  reducer: withSnapshotHandling(rootReducer),
});

const applier = createReduxSnapshotApplier(store, {
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

const applier = createReduxSnapshotApplier(store, {
  toState: (data: CartDTO, { store }) => ({
    items: data.items,
    totalPrice: data.total,
  }),
});
```

## See also

- [Quickstart](/guide/quickstart) — full wiring example
- [Multi-window patterns](/guide/multi-window) — cross-tab architecture
