/**
 * `@statesync/mobx` — MobX adapter for the state-sync revision-based
 * synchronization engine.
 *
 * This package provides a {@link createMobXSnapshotApplier} factory that
 * creates a {@link SnapshotApplier} capable of applying incoming snapshots
 * directly into a MobX observable store by mutating it in place, preserving
 * the original object reference so that all existing `autorun`, `reaction`,
 * and `observer` subscriptions continue to work.
 *
 * @example
 * ```ts
 * import { makeAutoObservable, runInAction } from 'mobx';
 * import { createMobXSnapshotApplier } from '@statesync/mobx';
 *
 * class ProfileStore {
 *   name = '';
 *   email = '';
 *   constructor() { makeAutoObservable(this); }
 * }
 * const store = new ProfileStore();
 * const applier = createMobXSnapshotApplier(store, { runInAction });
 * ```
 *
 * @packageDocumentation
 */
export * from './mobx';
