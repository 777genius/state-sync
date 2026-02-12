**@statesync/svelte**

***

# @statesync/svelte

@statesync/svelte

Svelte framework adapter for state-sync. Provides a createSvelteSnapshotApplier
factory that bridges the state-sync revision engine with Svelte's reactivity model.

Supports two target modes:
- **store** (default) -- Svelte 4 writable stores (`set` / `update`)
- **state** -- Svelte 5 `$state` runes (in-place property mutation)

## Interfaces

- [SvelteStoreLike](interfaces/SvelteStoreLike.md)

## Type Aliases

- [SvelteApplyMode](type-aliases/SvelteApplyMode.md)
- [SvelteSnapshotApplierOptions](type-aliases/SvelteSnapshotApplierOptions.md)
- [SvelteStateSnapshotApplierOptions](type-aliases/SvelteStateSnapshotApplierOptions.md)
- [SvelteStoreSnapshotApplierOptions](type-aliases/SvelteStoreSnapshotApplierOptions.md)
- [SvelteTargetKind](type-aliases/SvelteTargetKind.md)
