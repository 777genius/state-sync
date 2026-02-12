**@statesync/pinia**

***

# @statesync/pinia

`@statesync/pinia` — Pinia adapter for the state-sync revision-based
synchronization engine.

This package provides a [createPiniaSnapshotApplier](functions/createPiniaSnapshotApplier.md) factory that
creates a SnapshotApplier capable of applying incoming snapshots
directly into a Pinia store via `$patch`.

## Example

```ts
import { defineStore } from 'pinia';
import { createPiniaSnapshotApplier } from '@statesync/pinia';

const useUserStore = defineStore('user', {
  state: () => ({ name: '', email: '' }),
});

const store = useUserStore();
const applier = createPiniaSnapshotApplier(store);
```

## Interfaces

- [PiniaStoreLike](interfaces/PiniaStoreLike.md)

## Type Aliases

- [PiniaApplyMode](type-aliases/PiniaApplyMode.md)
- [PiniaSnapshotApplierOptions](type-aliases/PiniaSnapshotApplierOptions.md)

## Functions

- [createPiniaSnapshotApplier](functions/createPiniaSnapshotApplier.md)
