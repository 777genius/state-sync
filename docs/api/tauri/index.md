**@statesync/tauri**

***

# @statesync/tauri

@statesync/tauri — Tauri transport and persistence bindings for state-sync.

This package bridges the [Tauri v2](https://v2.tauri.app) IPC layer
(events + commands) with the `@statesync/core` revision-sync engine, giving
Tauri desktop/mobile apps reactive, revision-based state synchronization
between the Rust backend and TypeScript frontend.

Main entry points:
- [createTauriRevisionSync](functions/createTauriRevisionSync.md) — one-call convenience factory
- [createTauriInvalidationSubscriber](functions/createTauriInvalidationSubscriber.md) / [createTauriSnapshotProvider](functions/createTauriSnapshotProvider.md) — lower-level transport primitives
- [createTauriFileBackend](functions/createTauriFileBackend.md) — Tauri-command-backed persistence

## Example

```typescript
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { createTauriRevisionSync } from '@statesync/tauri';

interface AppSettings {
  theme: 'light' | 'dark';
  locale: string;
}

const sync = createTauriRevisionSync<AppSettings>({
  topic: 'settings',
  listen,
  invoke,
  eventName: 'settings-changed',
  commandName: 'get_settings',
  applier: {
    apply(snapshot) {
      console.log('New settings:', snapshot.data);
    },
  },
});

await sync.start();
```

## Interfaces

- [CreateTauriRevisionSyncOptions](interfaces/CreateTauriRevisionSyncOptions.md)
- [StorageBackend](interfaces/StorageBackend.md)
- [TauriFileBackendOptions](interfaces/TauriFileBackendOptions.md)
- [TauriInvalidationSubscriberOptions](interfaces/TauriInvalidationSubscriberOptions.md)
- [TauriSnapshotProviderOptions](interfaces/TauriSnapshotProviderOptions.md)

## Type Aliases

- [TauriInvoke](type-aliases/TauriInvoke.md)
- [TauriListen](type-aliases/TauriListen.md)

## Functions

- [createTauriFileBackend](functions/createTauriFileBackend.md)
- [createTauriInvalidationSubscriber](functions/createTauriInvalidationSubscriber.md)
- [createTauriRevisionSync](functions/createTauriRevisionSync.md)
- [createTauriSnapshotProvider](functions/createTauriSnapshotProvider.md)
