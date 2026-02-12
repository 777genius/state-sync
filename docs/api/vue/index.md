**@statesync/vue**

***

# @statesync/vue

@statesync/vue

Vue framework adapter for state-sync. Provides a createVueSnapshotApplier
factory that bridges the state-sync revision engine with Vue's reactivity system.

Supports two target modes:
- **reactive** (default) -- Vue `reactive()` objects (in-place property mutation)
- **ref** -- Vue `ref()` / `shallowRef()` containers (`.value` replacement)

## Interfaces

- [VueRefLike](interfaces/VueRefLike.md)

## Type Aliases

- [VueApplyMode](type-aliases/VueApplyMode.md)
- [VueReactiveSnapshotApplierOptions](type-aliases/VueReactiveSnapshotApplierOptions.md)
- [VueRefSnapshotApplierOptions](type-aliases/VueRefSnapshotApplierOptions.md)
- [VueSnapshotApplierOptions](type-aliases/VueSnapshotApplierOptions.md)
- [VueTargetKind](type-aliases/VueTargetKind.md)
