/**
 * `@statesync/pinia` — Pinia adapter for the state-sync revision-based
 * synchronization engine.
 *
 * This package provides a {@link createPiniaSnapshotApplier} factory that
 * creates a {@link SnapshotApplier} capable of applying incoming snapshots
 * directly into a Pinia store via `$patch`.
 *
 * @example
 * ```ts
 * import { defineStore } from 'pinia';
 * import { createPiniaSnapshotApplier } from '@statesync/pinia';
 *
 * const useUserStore = defineStore('user', {
 *   state: () => ({ name: '', email: '' }),
 * });
 *
 * const store = useUserStore();
 * const applier = createPiniaSnapshotApplier(store);
 * ```
 *
 * @packageDocumentation
 */
export * from './pinia';
