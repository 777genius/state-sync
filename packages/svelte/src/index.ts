/**
 * @statesync/svelte
 *
 * Svelte framework adapter for state-sync. Provides a {@link createSvelteSnapshotApplier}
 * factory that bridges the state-sync revision engine with Svelte's reactivity model.
 *
 * Supports two target modes:
 * - **store** (default) -- Svelte 4 writable stores (`set` / `update`)
 * - **state** -- Svelte 5 `$state` runes (in-place property mutation)
 *
 * @packageDocumentation
 */
export * from './svelte';
