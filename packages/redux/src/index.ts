/**
 * `@statesync/redux` — Redux adapter for the state-sync revision-based
 * synchronization engine.
 *
 * This package provides two approaches for applying snapshots to a Redux store:
 *
 * 1. **{@link withSnapshotHandling}** — a higher-order function that wraps
 *    your reducer to automatically handle snapshot actions (zero-config).
 * 2. **{@link snapshotApplied}** action creator + **{@link SNAPSHOT_ACTION_TYPE}**
 *    — for manual handling in RTK `extraReducers` or custom reducers.
 *
 * Both work together via {@link createReduxSnapshotApplier}, which creates a
 * standard {@link SnapshotApplier} that dispatches snapshot actions to the store.
 *
 * @example
 * ```ts
 * import { configureStore } from '@reduxjs/toolkit';
 * import { createReduxSnapshotApplier, withSnapshotHandling } from '@statesync/redux';
 *
 * const store = configureStore({
 *   reducer: withSnapshotHandling(rootReducer),
 * });
 *
 * const applier = createReduxSnapshotApplier(store);
 * ```
 *
 * @packageDocumentation
 */
export * from './redux';
