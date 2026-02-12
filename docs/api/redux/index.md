**@statesync/redux**

***

# @statesync/redux

`@statesync/redux` — Redux adapter for the state-sync revision-based
synchronization engine.

This package provides two approaches for applying snapshots to a Redux store:

1. **[withSnapshotHandling](functions/withSnapshotHandling.md)** — a higher-order function that wraps
   your reducer to automatically handle snapshot actions (zero-config).
2. **[snapshotApplied](functions/snapshotApplied.md)** action creator + **[SNAPSHOT\_ACTION\_TYPE](variables/SNAPSHOT_ACTION_TYPE.md)**
   — for manual handling in RTK `extraReducers` or custom reducers.

Both work together via [createReduxSnapshotApplier](functions/createReduxSnapshotApplier.md), which creates a
standard SnapshotApplier that dispatches snapshot actions to the store.

## Example

```ts
import { configureStore } from '@reduxjs/toolkit';
import { createReduxSnapshotApplier, withSnapshotHandling } from '@statesync/redux';

const store = configureStore({
  reducer: withSnapshotHandling(rootReducer),
});

const applier = createReduxSnapshotApplier(store);
```

## Interfaces

- [ReduxStoreLike](interfaces/ReduxStoreLike.md)
- [SnapshotAppliedAction](interfaces/SnapshotAppliedAction.md)

## Type Aliases

- [ReduxApplyMode](type-aliases/ReduxApplyMode.md)
- [ReduxSnapshotApplierOptions](type-aliases/ReduxSnapshotApplierOptions.md)

## Variables

- [SNAPSHOT\_ACTION\_TYPE](variables/SNAPSHOT_ACTION_TYPE.md)

## Functions

- [createReduxSnapshotApplier](functions/createReduxSnapshotApplier.md)
- [snapshotApplied](functions/snapshotApplied.md)
- [withSnapshotHandling](functions/withSnapshotHandling.md)
