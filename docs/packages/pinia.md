---
title: Pinia (@statesync/pinia)
---

## Purpose

`@statesync/pinia` is a **framework adapter**: it knows how to apply snapshots to a Pinia store.

## API

- `createPiniaSnapshotApplier(store, options?)`
  - `mode: 'patch' | 'replace'`
  - `pickKeys` / `omitKeys` — protect local/ephemeral fields

## Example

```ts
import { createRevisionSync } from '@statesync/core';
import { createPiniaSnapshotApplier } from '@statesync/pinia';

const applier = createPiniaSnapshotApplier(myStore, {
  mode: 'patch',
  omitKeys: ['localUiFlag'],
});

const handle = createRevisionSync({
  topic: 'app-config',
  subscriber,
  provider,
  applier,
});

await handle.start();
```

See: [Pinia adapter notes](/adapters/pinia).

