**@statesync/zustand**

***

# @statesync/zustand

`@statesync/zustand` — Zustand adapter for the state-sync revision-based
synchronization engine.

This package provides a [createZustandSnapshotApplier](functions/createZustandSnapshotApplier.md) factory that
creates a SnapshotApplier capable of applying incoming snapshots
directly into a Zustand store via `setState`.

## Example

```ts
import { create } from 'zustand';
import { createZustandSnapshotApplier } from '@statesync/zustand';

const useStore = create<{ name: string; email: string }>(() => ({
  name: '',
  email: '',
}));

const applier = createZustandSnapshotApplier(useStore);
```

## Interfaces

- [ZustandStoreLike](interfaces/ZustandStoreLike.md)

## Type Aliases

- [ZustandApplyMode](type-aliases/ZustandApplyMode.md)
- [ZustandSnapshotApplierOptions](type-aliases/ZustandSnapshotApplierOptions.md)

## Functions

- [createZustandSnapshotApplier](functions/createZustandSnapshotApplier.md)
