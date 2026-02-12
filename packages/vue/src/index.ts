/**
 * @statesync/vue
 *
 * Vue framework adapter for state-sync. Provides a {@link createVueSnapshotApplier}
 * factory that bridges the state-sync revision engine with Vue's reactivity system.
 *
 * Supports two target modes:
 * - **reactive** (default) -- Vue `reactive()` objects (in-place property mutation)
 * - **ref** -- Vue `ref()` / `shallowRef()` containers (`.value` replacement)
 *
 * @packageDocumentation
 */
export * from './vue';
