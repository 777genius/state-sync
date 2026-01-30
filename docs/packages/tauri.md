---
title: Tauri (state-sync-tauri)
---

## Назначение

`state-sync-tauri` — это **transport adapter**:
- `createTauriInvalidationSubscriber()` (events)
- `createTauriSnapshotProvider()` (invoke)

Плюс DX сахар:
- `createTauriRevisionSync()` — готовый wiring transport + core engine

## Пример (DX sugar)

```ts
import { createTauriRevisionSync } from 'state-sync-tauri';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

const handle = createTauriRevisionSync({
  topic: 'settings',
  listen,
  invoke,
  eventName: 'state-sync:invalidation',
  commandName: 'get_snapshot',
  args: { topic: 'settings' },
  applier: myApplier,
});

await handle.start();
```

## Peer dependency policy

`@tauri-apps/api` объявлен как optional peer dependency (для тестов можно не ставить).

