/**
 * `@statesync/valtio` — Valtio adapter for the state-sync revision-based
 * synchronization engine.
 *
 * This package provides a {@link createValtioSnapshotApplier} factory that
 * creates a {@link SnapshotApplier} capable of applying incoming snapshots
 * directly into a Valtio proxy by mutating it in place, preserving the
 * original proxy reference so that all existing subscribers continue to work.
 *
 * @example
 * ```ts
 * import { proxy } from 'valtio';
 * import { createValtioSnapshotApplier } from '@statesync/valtio';
 *
 * const state = proxy({ name: '', email: '' });
 * const applier = createValtioSnapshotApplier(state);
 * ```
 *
 * @packageDocumentation
 */
export * from './valtio';
