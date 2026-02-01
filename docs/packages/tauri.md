---
title: Tauri (@statesync/tauri)
---

## Purpose

`@statesync/tauri` is a **transport adapter**:
- `createTauriInvalidationSubscriber()` (events)
- `createTauriSnapshotProvider()` (invoke)

Plus DX sugar:
- `createTauriRevisionSync()` — ready-made wiring of transport + core engine

## Example (DX sugar)

```ts
import { createTauriRevisionSync } from '@statesync/tauri';
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

`@tauri-apps/api` is declared as an optional peer dependency (so tests can run without installing it).

