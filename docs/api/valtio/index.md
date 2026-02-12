**@statesync/valtio**

***

# @statesync/valtio

`@statesync/valtio` — Valtio adapter for the state-sync revision-based
synchronization engine.

This package provides a [createValtioSnapshotApplier](functions/createValtioSnapshotApplier.md) factory that
creates a SnapshotApplier capable of applying incoming snapshots
directly into a Valtio proxy by mutating it in place, preserving the
original proxy reference so that all existing subscribers continue to work.

## Example

```ts
import { proxy } from 'valtio';
import { createValtioSnapshotApplier } from '@statesync/valtio';

const state = proxy({ name: '', email: '' });
const applier = createValtioSnapshotApplier(state);
```

## Type Aliases

- [ValtioApplyMode](type-aliases/ValtioApplyMode.md)
- [ValtioProxyLike](type-aliases/ValtioProxyLike.md)
- [ValtioSnapshotApplierOptions](type-aliases/ValtioSnapshotApplierOptions.md)

## Functions

- [createValtioSnapshotApplier](functions/createValtioSnapshotApplier.md)
