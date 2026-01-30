---
title: Pinia (state-sync-pinia)
---

## Назначение

`state-sync-pinia` — это **framework adapter**: он умеет применять snapshot в Pinia store.

## API

- `createPiniaSnapshotApplier(store, options?)`
  - `mode: 'patch' | 'replace'`
  - `pickKeys` / `omitKeys` — защита локальных/эпемерных полей

## Пример

```ts
import { createRevisionSync } from 'state-sync';
import { createPiniaSnapshotApplier } from 'state-sync-pinia';

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

Подробнее: [Pinia adapter notes](/adapters/pinia).

