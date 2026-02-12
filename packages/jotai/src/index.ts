/**
 * `@statesync/jotai` — Jotai adapter for the state-sync revision-based
 * synchronization engine.
 *
 * This package provides a {@link createJotaiSnapshotApplier} factory that
 * creates a {@link SnapshotApplier} capable of applying incoming snapshots
 * into a Jotai atom via a Jotai store.
 *
 * @example
 * ```ts
 * import { atom, createStore } from 'jotai/vanilla';
 * import { createJotaiSnapshotApplier } from '@statesync/jotai';
 *
 * const store = createStore();
 * const profileAtom = atom({ name: '', email: '' });
 * const applier = createJotaiSnapshotApplier(store, profileAtom);
 * ```
 *
 * @packageDocumentation
 */
export * from './jotai';
