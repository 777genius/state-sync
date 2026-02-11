/**
 * `@statesync/zustand` — Zustand adapter for the state-sync revision-based
 * synchronization engine.
 *
 * This package provides a {@link createZustandSnapshotApplier} factory that
 * creates a {@link SnapshotApplier} capable of applying incoming snapshots
 * directly into a Zustand store via `setState`.
 *
 * @example
 * ```ts
 * import { create } from 'zustand';
 * import { createZustandSnapshotApplier } from '@statesync/zustand';
 *
 * const useStore = create<{ name: string; email: string }>(() => ({
 *   name: '',
 *   email: '',
 * }));
 *
 * const applier = createZustandSnapshotApplier(useStore);
 * ```
 *
 * @packageDocumentation
 */
export * from './zustand';
